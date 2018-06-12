import * as _ from 'lodash';
import { Proxy } from "../../models/Proxy";
import { IProxy } from "../../interfaces/IProxy";
import { IProxyTransport } from "../../interfaces/IProxyTransport";
import { ClientProxyModel } from "../entities/ClientProxyModel";

class ProxyController {
    static async getProxiesByProtocol(req, res) {
        try {
            let proxies = await Proxy
                .scope(
                    'checked',
                    {
                        method: ['protocol', req.query.protocol]
                    })
                .findAll({
                    attributes: ['isoCode', 'port', 'server', 'country', 'checked', 'lastChecked']
                });

            let response = _.map(proxies, proxy => new ClientProxyModel(proxy, ProxyController.getProxyTransport(proxy)));

            return res.json(response);
        } catch (e) {
            res.json([]);
            throw e;
        }
    }

    private static getProxyTransport(proxy : IProxy) : IProxyTransport {
        let priority = ['SOCKS5', 'HTTPS', 'HTTP'];

        return _(proxy.proxyTransports)
            .sort(protocol => priority.indexOf(protocol.protocol))
            .first();

    }
}

const rest = {
    get: ProxyController.getProxiesByProtocol
};

module.exports = rest;