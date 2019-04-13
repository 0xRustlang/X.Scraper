import { Proxy } from "./models/Proxy";
import logger from "./logger";

export default class ProxyCleaner {
    public async cleanProxy(): Promise<void> {
        const count = await Proxy.scope('eliglibleToClean', { method: ['uptime', 0.5, '<='] }).destroy();
        logger.debug(`Deleted ${count} proxies`);
    }
}
