import { MeterApi } from "./xmeterapi/api";
import { proxiesToXMeter, proxyNodesToProxies } from './utils';
import { IProxy } from "./interfaces/IProxy";
import * as moment from "moment";
import * as _ from 'lodash';
import { Proxy } from "./models/Proxy";
import { ProxyTransport } from "./models/ProxyTransport";
import { logger } from "./logger";
import { sequelize } from "./Sequelize";

class ProxyChecker {
    private meterApi : MeterApi;

    constructor(meterApi : MeterApi) {
        this.meterApi = meterApi;
    }

    public async checkProxies() : Promise<void> {
        let proxiesToCheck = await Proxy
            .scope('check')
            .findAll({ attributes: ["id", "server", "port", "isoCode", "country", "checked", "lastChecked", "createdAt", "updatedAt"] });

        if (!_.size(proxiesToCheck)) {
            return;
        }

        logger.debug(`Sending ${_.size(proxiesToCheck)} to XMeter`);

        let xmeterRequest = proxiesToXMeter(proxiesToCheck);
        let xmeterResult = await this.meterApi.checkReliability(xmeterRequest);

        let checkedProxies = proxyNodesToProxies(xmeterResult.body);
        let transaction = await sequelize.transaction();

        try {
            let promises = [];
            let counter = 0;

            _.each(checkedProxies, (checkedProxy) => {
                if (ProxyChecker.isProxyAlive(checkedProxy)) {
                    counter++;
                    let modeledProxy = _.find(proxiesToCheck, { server: checkedProxy.server, port: checkedProxy.port });

                    promises.push( // update checked time
                        modeledProxy.updateAttributes(checkedProxy, { transaction })
                    );

                    promises.push( // delete old transports
                        ProxyTransport.destroy({
                            where: { proxyServer: modeledProxy.id },
                            transaction
                        })
                    );

                    // create new transports
                    _.each(checkedProxy.proxyTransports, (transport) => {
                        let transportWithId = _.extend(transport, { proxyServer: modeledProxy.id });
                        promises.push(
                            ProxyTransport.create(transportWithId, { transaction })
                        );
                    });
                } else {
                    promises.push( // delete dead proxy
                        Proxy.destroy({
                            where: {
                                server: checkedProxy.server,
                                port: checkedProxy.port
                            },
                            transaction
                        })
                    )
                }
            });

            logger.debug(`Checked ${_.size(checkedProxies)} proxies. Alive: ${counter}`);
            await Promise.all(promises);
            await transaction.commit();
        } catch (e) {
            await transaction.rollback();
            logger.error(`Rollback. Reason: ${e}`);
        }
    }

    private static isProxyAlive(proxy : IProxy) : boolean {
        return _.some(proxy.proxyTransports, (ratio) => {
            return ratio.lossRatio !== 1;
        })
    }
}

export { ProxyChecker };