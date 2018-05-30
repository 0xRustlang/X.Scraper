import * as express from 'express'
import {RedisProxyManager} from "./RedisProxyManager";
import {Express} from "express";
import {_} from 'lodash';

class App {
    private express: Express;
    private redisProxyManager: RedisProxyManager;

    constructor(redisProxyManager: RedisProxyManager) {
        this.express = express();
        this.redisProxyManager = redisProxyManager;
        this.mountRoutes()
    }

    private mountRoutes(): void {
        const router = express.Router();
        router.get('/', async (req, res) => {
            try {
                let proxies = await this.redisProxyManager.getProxies();
                proxies = _.filter(proxies, proxy => proxy.checked);
                return res.json(proxies);
            } catch (e) {
                console.log(`Failed to get proxies. Reason: ${e}`);
                return res.json([]);
            }
        });
        this.express.use('/proxy', router)
    }

    public async listen(port: number): Promise<any> {
        this.express.listen(port, (err) => {
            if (err) {
                console.error(`Couldn't bind to port: ${port}. Reason: ${err}`);
                throw new Error(`Couldn't bind to port: ${port}. Reason: ${err}`);
            }

            return console.log(`Started listening on port ${port}`);
        });
    }
}

export {App}
