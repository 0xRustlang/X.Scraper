import * as _ from 'lodash';
import { Proxy } from "../../models/Proxy";
import { ClientProxyModel } from "../entities/ClientProxyModel";

class ProxyController {
    static async getProxiesByProtocol(req, res) {
        let offset = req.query.offset;
        let limit = req.query.limit || 100;

        try {
            let proxies = await Proxy
                .scope(
                    'checked'
                )
                .scope(
                    req.query.protocol
                        ? { method: ['protocol', req.query.protocol] }
                        : {}
                )
                .findAll({
                    attributes: ['isoCode', 'port', 'server', 'country', 'checked', 'lastChecked', 'createdAt', 'protocol', 'pingTimeMs', 'lossRatio'],
                    offset: offset,
                    limit: limit,
                    order: [
                        ['createdAt', 'DESC'],
                        ['pingTimeMs', 'ASC']
                    ]
                });

            let response = _.map(proxies, proxy => new ClientProxyModel(proxy));

            return res.json(response);
        } catch (e) {
            res.json([]);
            throw e;
        }
    }
}

const rest = {
    get: ProxyController.getProxiesByProtocol
};

module.exports = rest;