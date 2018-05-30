import {RedisClient} from "redis";
import {IProxy} from "./interfaces/IProxy";
import {_} from 'lodash';
import {normalizeProxy} from "./utils";
import * as moment from "moment";

const workedProxyKey = 'proxy_key';

class RedisProxyManager {
    private redisClient: RedisClient;

    public constructor(redisClient: RedisClient) {
        this.redisClient = redisClient;
    }

    public addProxy(proxy: IProxy): void {
        this.redisClient.hsetnx(workedProxyKey, RedisProxyManager.fieldKeyFromProxy(proxy), JSON.stringify(normalizeProxy(proxy)));
    }

    public addProxies(proxies: Array<IProxy>): void {
        _.each(proxies, (proxy) => this.addProxy(proxy));
    }

    public updateProxy(proxy: IProxy): void {
        this.redisClient.hset(workedProxyKey, RedisProxyManager.fieldKeyFromProxy(proxy), JSON.stringify(normalizeProxy(proxy)));
    }

    public updateProxies(proxies: Array<IProxy>): void {
        _.each(proxies, (proxy) => this.updateProxy(proxy));
    }

    public getProxies(): Promise<Array<IProxy>> {
        return new Promise(((resolve, reject) => {
            this.redisClient.hgetall(workedProxyKey, (err, obj) => {
                if (err) reject(err);

                let proxies = _.reduce(obj, (acc, value, key) => {
                    let fetched = JSON.parse(value);
                    fetched.lastChecked = moment(fetched.lastChecked);
                    acc[key] = fetched;
                    return acc;
                }, {});

                resolve(proxies);
            })
        }));
    }

    public deleteProxy(proxy: IProxy): void {
        this.redisClient.hdel(workedProxyKey, RedisProxyManager.fieldKeyFromProxy(proxy));
    }

    public deleteProxies(proxies: Array<IProxy>): void {
        _.each(proxies, (proxy) => this.deleteProxy(proxy));
    }

    private static fieldKeyFromProxy(proxy: IProxy): string {
        return `${proxy.server}:${proxy.port}`;
    }


}

export {RedisProxyManager};