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
        let allProxies = await Proxy.findAll();
        let proxiesToCheck = _.filter(allProxies, ProxyChecker.isProxyWorthChecking);
        if (!_.size(proxiesToCheck)) {
            return;
        }

        let xmeterRequest = proxiesToXMeter(proxiesToCheck);
        let xmeterResult = null;
        try {
            xmeterResult = await this.meterApi.checkReliability(xmeterRequest);
        } catch (e) {
            console.error(`XMeter api responsed with error: ${e.response.body}`);
            xmeterResult = {body: []};
        }
        //TODO: придумать что-нибудь получшееее
        let checkedProxies = proxyNodesToProxies(xmeterResult.body);
        try {
            await Proxy.destroy({where: {server: _.map(checkedProxies, 'server')}});
        } catch (e) {
            console.log(`Failed to delete proxies. Reason: ${e}`);
        }

        let aliveProxies = _.filter(checkedProxies, ProxyChecker.isProxyAlive);
        try {
            _.each(aliveProxies, async (aliveProxy) => {
                await Proxy.create(aliveProxy, {include: [ProxyTransport]});
            });
        } catch (e) {
            console.log(`Failed to update alive proxies. Reason ${e}`);
        }
    }

    private static isProxyWorthChecking(proxy: IProxy): boolean {
        let ageMs = moment().utc().diff(proxy.lastChecked);
        let age = moment.duration(ageMs).asMinutes();
        return age > parseInt(process.env.CHECK_TIMEOUT) || !proxy.checked;
    }

    private static isProxyAlive(proxy: IProxy): boolean {
        return _.some(proxy.proxyTransports, (ratio) => {
            return ratio.lossRatio !== 1;
        })
    }
}

export {ProxyChecker};