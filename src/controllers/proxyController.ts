import { Get, Route, Query, Controller } from 'tsoa';
import * as _ from 'lodash';
import { Proxy } from "../models/Proxy";

@Route('proxy')
export class ProxyController extends Controller {
    @Get('/')
    public async getProxy(
        @Query() offset: number = 0,
        @Query() limit: number = 150,
        @Query() reliable: number = 2,
        @Query() country?: string,
        @Query() protocol?: string
    ): Promise<ProxyResponse[]> {
        try {
            let where: any = {};
            let scope: any = [];

            if (!_.isUndefined(country)) {
                where.isoCode = country;
            }

            if (!_.isUndefined(protocol)) {
                scope.push({
                    method: ['protocol', protocol]
                });
            }

            const proxyServers = await Proxy
                .scope(
                    { method: ['checkedTimes', reliable] },
                    ...scope
                )
                .findAll({
                    offset: offset,
                    limit: limit,
                    order: [
                        ['createdAt', 'DESC'],
                        ['pingTimeMs', 'ASC']
                    ],
                    where: where
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

export interface ProxyResponse {
    server: string;
    port: number;
    iso_code?: string;
    country?: string;
    protocol: string;
    ping_time_ms: number;
    loss_ratio: number;
}
