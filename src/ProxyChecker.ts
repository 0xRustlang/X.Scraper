import { MeterApi } from "./xmeterapi/api";
import { proxiesToXMeter, proxyNodesToProxies } from './utils';
import { IProxy } from "./interfaces/IProxy";
import * as _ from 'lodash';
import { Proxy } from "./models/Proxy";
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
            .findAll({
                attributes: ["id", "server", "port", "isoCode", "country", "checkedTimes", "lastChecked", "createdAt", "updatedAt"]
            });

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
                    let proxyModel = _.find(proxiesToCheck, { server: checkedProxy.server, port: checkedProxy.port });
                    checkedProxy.checkedTimes = proxyModel.checkedTimes + 1;

                    /**
                     * Update checked time
                     */
                    promises.push(
                        proxyModel.updateAttributes(checkedProxy, { transaction })
                    );
                } else {
                    promises.push(
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
        return proxy.lossRatio !== 1;
    }
}

export { ProxyChecker };
