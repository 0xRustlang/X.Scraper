import { IProxy } from './interfaces/IProxy'
import { Proxy, ProxyNode } from './xmeterapi/api'
import * as moment from 'moment'
import { Moment } from 'moment'

const _ = require('lodash');

function proxiesToXMeter(proxy: IProxy): Proxy {
    const newProxy = new Proxy();

    newProxy.server = proxy.server;
    newProxy.port = proxy.port;

    return newProxy;
}

function proxyNodesToProxies(proxies: Array<ProxyNode>): Array<IProxy> {
    return _.map(proxies, proxy => {
        return {
            isoCode: proxy.isoCode,
            port: proxy.port,
            server: proxy.server,
            country: proxy.country,
            lastChecked: moment().utc(),
            lossRatio: proxy.lossRatio,
            pingTimeMs: proxy.pingTimeMs,
            protocol: proxy.protocol
        };
    });
}

function momentToSQL(instance: Moment) {
    return instance.format('YYYY-MM-DD HH:mm:ssZZ');
}

function sqlToMoment(timestamp: string) {
    return moment.utc(timestamp, 'YYYY-MM-DD HH:mm:ssZZ');
}

export const proxyToPhantomOptions = (proxy: IProxy): Array<String> => {
    if (!proxy) {
        return [];
    }

    return [
        `--proxy=${proxy.server}:${proxy.port}`,
        `--proxy-type=${proxy.protocol.toString().toLowerCase()}`
    ];
};

export const toUniqueProxies = (proxies: Array<IProxy>): Array<IProxy> => {
    const map: Map<string, IProxy> = new Map();

    proxies.forEach(proxy => {
        const key = `${proxy.server}:${proxy.port}`;

        if (!map.has(key) || map.get(key).lossRatio >= proxy.lossRatio) {
            map.set(key, proxy);
        }
    });

    return [...map.values()];
};

_.mixin({ 'proxiesToSwagger': proxiesToXMeter });
_.mixin({ 'swaggerProxyNodeToProxy': proxyNodesToProxies });

export { proxiesToXMeter, proxyNodesToProxies, momentToSQL, sqlToMoment };
