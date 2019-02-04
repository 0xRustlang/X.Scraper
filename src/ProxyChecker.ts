import { MeterApi } from "./xmeterapi/api";
import { proxiesToXMeter, proxyNodesToProxies } from './utils';
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

    public async checkProxies(): Promise<void> {
        let proxyServers = await Proxy.scope('check').findAll();

        if (!_.size(proxyServers)) {
            return;
        }

        logger.debug(`Sending ${_.size(proxyServers)} to XMeter`);

        let xmeterRequest = proxiesToXMeter(proxyServers);
        let xmeterResult = await this.meterApi.checkReliability(xmeterRequest);

        let checkedProxies = proxyNodesToProxies(xmeterResult.body);
        let transaction = await sequelize.transaction();

        try {
            let promises = [];
            let proxyLossRatio = new Map();
            let aliveCounter = 0;

            _.each(checkedProxies, checkedProxy => {
                const key = `${checkedProxy.server}:${checkedProxy.port}`;

                if (checkedProxy.lossRatio === 1) {
                    const currentLossRatio = _.isNil(proxyLossRatio.get(key))
                        ? 1 : proxyLossRatio.get(key);

                    proxyLossRatio.set(key, Math.min(currentLossRatio, 1));
                } else {
                    const proxy = _.find(proxyServers, { server: checkedProxy.server, port: checkedProxy.port });

                    checkedProxy.checkedTimes = proxy.checkedTimes + 1;

                    promises.push(proxy.updateAttributes(checkedProxy, { transaction }));

                    ++aliveCounter;

                    proxyLossRatio.set(key, checkedProxy.lossRatio);
                }
            });

            proxyLossRatio.forEach(
                (lossRatio: Number, address: String) => {
                    if (lossRatio === 1) {
                        let [server, port] = address.split(':');

                        promises.push(
                            Proxy.destroy({
                                where: {
                                    server: server,
                                    port: port
                                },
                                transaction
                            })
                        )
                    }
                });

            logger.debug(`Checked ${_.size(proxyServers)} proxies. Alive: ${aliveCounter}`);

            await Promise.all(promises);
            await transaction.commit();
        } catch (e) {
            await transaction.rollback();
            logger.error(`Rollback. Reason: ${e}`);
        }

        await this.flushMetrics();
    }

    private async flushMetrics(): Promise<void> {
        const reliableProxyCount = await Proxy.scope('checked').count();

        const measurement = {
            timestamp: new Date(),
            fields: {
                reliable: reliableProxyCount
            },
        };

        influxClient.writeMeasurement('proxy', [measurement])
            .catch(
                (reason: any) => {
                    const { message } = reason;

                    logger.warn(message);
                }
            );
    }
}
