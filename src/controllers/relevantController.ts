import { Controller, Get, Route } from "tsoa";
import { IProxyResponse } from "../interfaces/IProxyResponse";
import * as _ from "lodash";
import { Proxy } from "../models/Proxy";

@Route('relevant')
export class RelevantController extends Controller {
    @Get('/')
    public async getRelevant(): Promise<IProxyResponse[]> {
        try {
            const proxyServers = await Proxy
                .scope(
                    'premium'
                )
                .findAll({
                    order: [
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
