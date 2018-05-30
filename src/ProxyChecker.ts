import {RedisProxyManager} from "./RedisProxyManager";
import {MeterApi} from "./generated/api";
import {_} from 'lodash';
import {proxiesToXMeter, proxyNodesToProxies} from './utils';
import moment = require("moment");
import {IProxy} from "./interfaces/IProxy";

class ProxyChecker {
    private redisProxyManager: RedisProxyManager;
    private meterApi: MeterApi;

    constructor(redisProxyManager: RedisProxyManager, meterApi: MeterApi) {
        this.redisProxyManager = redisProxyManager;
        this.meterApi = meterApi;
    }

    public async checkProxies(): Promise<void> {
        let allProxies = await this.redisProxyManager.getProxies();
        let proxiesToCheck = _.filter(allProxies, ProxyChecker.isProxyWorthChecking);

        let xmeterRequest = proxiesToXMeter(proxiesToCheck);
        let xmeterResult = null;
        try {
            xmeterResult = await this.meterApi.checkReliability(xmeterRequest);
        } catch (e) {
            console.error(`XMeter api responsed with error: ${e}`);
            xmeterResult = {body: []};
        }
        let checkedProxies = proxyNodesToProxies(xmeterResult.body);

        let deadProxies = _.filter(checkedProxies, ProxyChecker.isProxyDead);
        this.redisProxyManager.deleteProxies(deadProxies);

        let aliveProxies = _.difference(checkedProxies, deadProxies, _.isEqual);
        this.redisProxyManager.updateProxies(aliveProxies);
    }

    private static isProxyWorthChecking(proxy: IProxy): boolean {
        let ageMs = moment().utc().diff(proxy.lastChecked);
        let age = moment.duration(ageMs).asMinutes();
        return age > parseInt(process.env.CHECK_TIMEOUT) || !proxy.checked;
    }

    private static isProxyDead(proxy: IProxy): boolean {
        return _.every(proxy.ratios, (ratio) => {
            return ratio.lossRatio === 1;
        })
    }
}

export {ProxyChecker};