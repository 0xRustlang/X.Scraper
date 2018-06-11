import { IProxy } from './interfaces/IProxy';
import { Proxy, ProxyNode, ProxyNodeTransport } from './xmeterapi/api';
import * as moment from 'moment';
import { Moment } from 'moment';
import { IProxyTransport } from "./interfaces/IProxyTransport";
const _ = require('lodash');

function proxiesToXMeter(proxies : Array<IProxy>) : Array<Proxy> {
    return _.map(proxies, (proxy) => {
        let swagProxy = new Proxy();
        swagProxy.server = proxy.server;
        swagProxy.port = proxy.port;
        return swagProxy;
    })
}

function proxyNodesToProxies(proxies : Array<ProxyNode>) : Array<IProxy> {
    return _.map(proxies, (proxy) => {
        return {
            proxyTransports: proxyNodeRatiosToProxyRatios(proxy.transport),
            isoCode: proxy.isoCode,
            port: proxy.port,
            server: proxy.server,
            checked: true,
            lastChecked: moment().utc()
        };
    });
}

function proxyNodeRatiosToProxyRatios(proxyRatios : Array<ProxyNodeTransport>) : Array<IProxyTransport> {
    return _.map(proxyRatios, (proxyRatio) => {
        return {
            lossRatio: proxyRatio.lossRatio,
            pingTimeMs: proxyRatio.pingTimeMs,
            protocol: proxyRatio.protocol
        }
    });
}

function momentToSQL(instance : Moment) {
    return instance.format('YYYY-MM-DD HH:mm:ssZZ');
}

function sqlToMoment(timestamp : string) {
    return moment.utc(timestamp, 'YYYY-MM-DD HH:mm:ssZZ');
}

_.mixin({ 'proxiesToSwagger': proxiesToXMeter });
_.mixin({ 'swaggerProxyNodeToProxy': proxyNodesToProxies });

export { proxiesToXMeter, proxyNodesToProxies, proxyNodeRatiosToProxyRatios, momentToSQL, sqlToMoment };
