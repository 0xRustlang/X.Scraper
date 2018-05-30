import {IProxy} from "./interfaces/IProxy";
import {Proxies, ProxyNode, ProxyNodeRatios} from './generated/api';
import * as moment from "moment";
import {IProxyRatio} from "./interfaces/IProxyRatio";
const _ = require('lodash');

function proxiesToSwagger(proxies: Array<IProxy>): Array<Proxies> {
    return _.map(proxies, (proxy) => {
        let swagProxy = new Proxies();
        swagProxy.server = proxy.server;
        swagProxy.port = proxy.port;
        return swagProxy;
    })
}

function normalizeProxy(proxy: IProxy): IProxy {
    proxy.checked = proxy.checked || false;
    proxy.lastChecked = proxy.lastChecked || moment().utc().subtract(2, 'minutes');
    return proxy;
}

function proxyNodesToProxies(proxies: Array<ProxyNode>): Array<IProxy> {
    return _.map(proxies, (proxy) => {
        return {
            ratios: proxyNodeRatiosToProxyRatios(proxy.ratios),
            isoCode: proxy.isoCode,
            port: proxy.port,
            server: proxy.server,
            checked: true,
            lastChecked: moment().utc()
        };
    });
}

function proxyNodeRatiosToProxyRatios(proxyRatios: Array<ProxyNodeRatios>): Array<IProxyRatio> {
    return _.map(proxyRatios, (proxyRatio) => {
        return {
            lossRatio: proxyRatio.lossRatio,
            pingTimeMs: proxyRatio.pingTimeMs,
            protocol: proxyRatio.protocol
        }
    });
}

_.mixin({'proxiesToSwagger': proxiesToSwagger});
_.mixin({'swaggerProxyNodeToProxy': proxyNodesToProxies});

export {proxiesToSwagger, normalizeProxy, proxyNodesToProxies, proxyNodeRatiosToProxyRatios};
