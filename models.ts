import { Nohm, NohmModel, TTypedDefinitions } from 'nohm';
import { Redis } from 'redis';

let redisURL = process.env.REDIS_URL || '//127.0.0.1:6379';
let redisClient = Redis.createClient(redisURL);
let workedProxyKey = 'proxy_key';

Nohm.setClient(redisClient);
Nohm.setPrefix(workedProxyKey);

interface IProxyRatio {
    ping_time_ms: number;
    loss_ratio: number;
    protocol: string;
}

interface IProxyProperties {
    server: string;
    port: string;
    iso_code: string;
    unchecked: boolean;
    //last_checked: Date;
    //ratios: Array<IProxyRatio>;
}

class ProxyModel extends NohmModel<IProxyProperties> {
    public static modelName = 'Proxy';

    protected static definitions: TTypedDefinitions<IProxyProperties> = {
        server: {
            type: 'string'
        },
        port: {
            type: 'string'
        },
        iso_code: {
            type: 'string'
        },
        unchecked: {
            type: 'boolean'
        }
    };

    public static async loadTyped(id: string): Promise<ProxyModel> {
        return proxyModelStatic.load<ProxyModel>(id);
    }
}

const proxyModelStatic = Nohm.register(ProxyModel);

export default ProxyModel;