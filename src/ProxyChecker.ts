import { MeterApi } from "./xmeterapi/api"
import { proxiesToXMeter, proxyNodesToProxies, toUniqueProxies } from './utils'
import * as _ from 'lodash'
import { Proxy } from "./models/Proxy"
import logger from "./logger"
import { sequelize } from "./Sequelize"
import influxClient from "./influxClient"
import { NonAbstractTypeOfModel } from "sequelize-typescript/lib/models/Model"

export default class ProxyChecker {
    /** @property {MeterApi} **/
    private meterApi: MeterApi;

    /**
     * @param {MeterApi} meterApi
     */
    constructor(meterApi: MeterApi) {
        this.meterApi = meterApi;
    }

    /**
     * @returns {Promise<void>}
     */
    async checkDeadProxies(): Promise<void> {
        for await (const proxies of this.batch(Proxy.scope('checkDead'))) {
            logger.debug(`Sending ${_.size(proxies)} alive to XMeter`);
            await this.run(proxies);
        }
    }

    /**
     * @returns {Promise<void>}
     */
    async checkProxies(): Promise<void> {
        for await (const proxies of this.batch(Proxy.scope('check'))) {
            logger.debug(`Sending ${_.size(proxies)} alive to XMeter`);
            await this.run(proxies);
        }

        await this.flushMetrics();
    }

    /**
     * @param {Array<Proxy>} proxyServers
     * @returns {Promise<void>}
     */
    async run(proxyServers: Array<Proxy>): Promise<void> {
        const xm = await this.meterApi.checkReliability(proxyServers.map(proxiesToXMeter));
        const proxies = toUniqueProxies(proxyNodesToProxies(xm.body));
        const transaction = await sequelize.transaction();

        try {
            let promises = [];
            let aliveCounter = 0;
            let deletedCounter = 0;

            proxies.forEach(checkedProxy => {
                const proxy = _.find(proxyServers, { server: checkedProxy.server, port: checkedProxy.port });

                if (checkedProxy.lossRatio < 1) {
                    ++aliveCounter;
                    checkedProxy.passedTimes = proxy.passedTimes + 1;
                } else if (checkedProxy.checkedTimes === 0) {
                    promises.push(Proxy.destroy({ where: { server: checkedProxy.server, port: checkedProxy.port }, transaction }));
                    deletedCounter++;
                }

                checkedProxy.checkedTimes = proxy.checkedTimes + 1;
                promises.push(proxy.updateAttributes(checkedProxy, { transaction }));
            });

            logger.debug(`Checked ${_.size(proxyServers)} proxies. Alive: ${aliveCounter}. Deleted: ${deletedCounter}`);

            await Promise.all(promises);
            await transaction.commit();
        } catch (e) {
            await transaction.rollback();
            logger.error(`Rollback. Reason: ${e}`);
        }
    }

    /**
     * @param {NonAbstractTypeOfModel<Proxy>} m
     * @param {Number} limit
     * @param {Number} offset
     */
    async* batch(m: NonAbstractTypeOfModel<Proxy>, limit: number = 1000, offset: number = 0) {
        do {
            yield m.findAll({ limit, offset });
            offset += limit;
        } while (await m.count() < offset)
    }

    /**
     * @returns {Promise<void>}
     */
    async flushMetrics(): Promise<void> {
        const freeProxyCount = await Proxy.scope('free').count();
        const premiumProxyCount = await Proxy.scope('premium', { method: ['uptime', 0.9] }).count();
        const allProxyCount = await Proxy.count();

        const measurement = {
            timestamp: new Date(),
            fields: {
                freeProxyCount,
                premiumProxyCount,
                allProxy: allProxyCount
            },
        };

        try {
            await influxClient.writeMeasurement('proxy', [measurement]);
        } catch (e) {
            logger.warn(e.message);
        }
    }
}
