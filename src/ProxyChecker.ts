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
            .findAll({ attributes: ['port', 'server', 'checked', 'lastChecked'] });

        if (!_.size(proxiesToCheck)) {
            return;
        }

        let xmeterRequest = proxiesToXMeter(proxiesToCheck);
        let xmeterResult = await this.meterApi.checkReliability(xmeterRequest);

        //TODO: придумать что-нибудь получше
        let checkedProxies = proxyNodesToProxies(xmeterResult.body);
        let transaction = await sequelize.transaction();

        try {
            await Proxy.destroy({
                where: { server: _.map(checkedProxies, 'server') },
                transaction
            });

            let aliveProxies = _.filter(checkedProxies, ProxyChecker.isProxyAlive);
            logger.debug(`Checked ${_.size(checkedProxies)} proxies. Alive: ${_.size(aliveProxies)}`);

            for (let aliveProxy in aliveProxies) {
                await Proxy.create(aliveProxies[aliveProxy], {
                    include: [ProxyTransport],
                    transaction
                });
            }

            transaction.commit();
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