import { MeterApi } from "./xmeterapi/api";
import { proxiesToXMeter, proxyNodesToProxies, toUniqueProxies } from './utils';
import * as _ from 'lodash';
import { Proxy } from "./models/Proxy";
import logger from "./logger";
import { sequelize } from "./Sequelize";
import influxClient from "./influxClient"

export default class ProxyChecker {
    private meterApi: MeterApi;

    constructor(meterApi: MeterApi) {
        this.meterApi = meterApi;
    }

    public async checkDeadProxies(): Promise<void> {
        const proxyServers = await Proxy.scope('checkDead').findAll();

        if (!_.size(proxyServers)) {
            return;
        }

        logger.debug(`Sending ${_.size(proxyServers)} dead to XMeter`);
        await this.checkInternal(proxyServers);
    }

    public async checkProxies(): Promise<void> {
        const proxyServers = await Proxy.scope('check').findAll();

        if (!_.size(proxyServers)) {
            return;
        }

        logger.debug(`Sending ${_.size(proxyServers)} alive to XMeter`);
        await this.checkInternal(proxyServers);
        await this.flushMetrics();
    }

    private async checkInternal(proxyServers: Array<Proxy>): Promise<void> {
        const batches = await Promise.all(_.chunk(proxyServers, 3000).map(proxiesToXMeter).map(v => this.meterApi.checkReliability(v)));
        const checkedProxies = proxyNodesToProxies(_.flatMap(batches, 'body'));
        const transaction = await sequelize.transaction();
        const proxies = toUniqueProxies(checkedProxies);

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
                    promises.push(
                        Proxy.destroy({
                            where: { server: checkedProxy.server, port: checkedProxy.port },
                            transaction
                        })
                    );

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

    private async flushMetrics(): Promise<void> {
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
