import {MeterApi} from "./xmeterapi/api";
import {proxiesToXMeter, proxyNodesToProxies} from './utils';
import {IProxy} from "./interfaces/IProxy";
import * as moment from "moment";
import * as _ from 'lodash';
import {Proxy} from "./models/Proxy";
import {ProxyTransport} from "./models/ProxyTransport";

class ProxyChecker {
    private meterApi: MeterApi;

    constructor(meterApi: MeterApi) {
        this.meterApi = meterApi;
    }

    public async checkProxies(): Promise<void> {
        let proxiesToCheck = await Proxy
            .scope('check')
            .findAll({attributes: ['port', 'server', 'checked', 'lastChecked']});

        if (!_.size(proxiesToCheck)) {
            return;
        }

        let xmeterRequest = proxiesToXMeter(proxiesToCheck);
        let xmeterResult = await this.meterApi.checkReliability(xmeterRequest);

        //TODO: придумать что-нибудь получшееее
        let checkedProxies = proxyNodesToProxies(xmeterResult.body);
        await Proxy.destroy({where: {server: _.map(checkedProxies, 'server')}});

        let aliveProxies = _.filter(checkedProxies, ProxyChecker.isProxyAlive);
        _.each(aliveProxies, async (aliveProxy) => {
            await Proxy.create(aliveProxy, {include: [ProxyTransport]});
        });
    }

    private static isProxyAlive(proxy: IProxy): boolean {
        return _.some(proxy.proxyTransports, (ratio) => {
            return ratio.lossRatio !== 1;
        })
    }
}

export {ProxyChecker};