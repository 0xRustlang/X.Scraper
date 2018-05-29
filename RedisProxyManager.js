const redis = require('redis');
const _ = require('lodash');

let redisURL = process.env.REDIS_URL || '//127.0.0.1:6379';
let redisClient = redis.createClient(redisURL);
let workedProxyKey = 'proxy_key';

class RedisProxyManager {

    static addProxy(proxy) {
        redisClient.hmset(workedProxyKey, `${proxy.server}:${proxy.port}`, JSON.stringify(proxy));
    }

    static addProxies(proxies) {
        _.each(proxies, this.addProxy);
    }

    static getProxies() {
        return new Promise((resolve, reject) => {
            redisClient.hgetall(workedProxyKey, (err, obj) => {
                if (err) reject(err);

                console.log(obj);
                resolve(obj);
            });
        });
    }
}

module.exports = RedisProxyManager;