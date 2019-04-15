import { Get, Route, Query, Controller } from 'tsoa';
import * as _ from 'lodash';
import { Proxy } from "../models/Proxy";
import { IProxyResponse } from "../interfaces/IProxyResponse";

@Route('proxy')
export class ProxyController extends Controller {
    @Get('/')
    public async getProxy(
        @Query() offset: number = 0,
        @Query() limit: number = 150,
        @Query() protocol?: "SOCKS5" | "HTTPS" | "HTTP"
    ): Promise<IProxyResponse[]> {
        try {
            let scope: any = [];

            if (!_.isUndefined(protocol)) {
                scope.push({
                    method: ['protocol', protocol]
                });
            }

            const proxyServers = await Proxy
                .scope(
                    'free',
                    ...scope
                )
                .findAll({
                    offset: offset,
                    limit: limit,
                    order: [
                        ['lastChecked', 'DESC'],
                        ['pingTimeMs', 'ASC']
                    ]
                });

            return _.map(
                proxyServers, proxy => ({
                    server: proxy.server,
                    port: parseInt(proxy.port),
                    iso_code: proxy.isoCode,
                    country: proxy.country,
                    protocol: String(proxy.protocol),
                    ping_time_ms: proxy.pingTimeMs,
                    loss_ratio: proxy.lossRatio
                })
            );
        } catch (e) {
            return [];
        }
    }
}

