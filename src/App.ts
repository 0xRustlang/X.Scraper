import * as express from 'express'
import {Express} from 'express'
import * as _ from 'lodash';
import {Proxy} from "./models/Proxy";
import {IProxy} from "./interfaces/IProxy";
import {IProxyTransport} from "./interfaces/IProxyTransport";
import {logger} from "./logger";

class App {
    private express: Express;

    constructor() {
        this.express = express();
        this.mountRoutes()
    }

    private mountRoutes(): void {
        const router = express.Router();
        router.get('/', async (req, res) => {
            try {
                let proxies = await Proxy.scope('full').findAll();

                let response = _.reduce(proxies, (acc, proxy) => {
                    acc.push(this.mapProxy(proxy, this.getProxyTransport(proxy)));
                    return acc;
                }, []);

                return res.json(response);
            } catch (e) {
                logger.error(`Failed to get proxies. Reason: ${e}`);
                return res.json([]);
            }
        });
        this.express.use('/proxy', router)
    }

    public listen(port: number): Promise<any> {
        return new Promise((resolve, reject) =>
            this.express.listen(port, (err) => {
                if (err) {
                    logger.error(`Couldn't bind to port: ${port}. Reason: ${err}`);
                    reject(new Error(`Couldn't bind to port: ${port}. Reason: ${err}`));
                    return;
                }

                logger.info(`Started listening on port ${port}`);
                resolve();
            }));
    }

    private mapProxy(proxy: IProxy, transport: IProxyTransport): object {
        return {
            ip: proxy.server,
            port: parseInt(proxy.port),
            loss_ratio: transport.lossRatio,
            ping_time_ms: transport.pingTimeMs,
            protocol: transport.protocol
        }
    }

    private getProxyTransport(proxy: IProxy): IProxyTransport {
        let priority = ['SOCKS5', 'HTTPS', 'HTTP'];

        return _(proxy.proxyTransports)
            .filter(protocol => protocol.lossRatio !== 1)
            .sort(protocol => priority.indexOf(protocol.protocol))
            .first();

    }

}

export {App}
