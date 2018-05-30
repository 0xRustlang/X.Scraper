require('dotenv').config();
import scheduler = require('node-schedule');
import Swagger = require('./generated/api');
import Redis = require('redis');
import {App} from './App';
import {UncheckedProxyGrabber} from './UncheckedProxyGrabber';
import {RedisProxyManager} from './RedisProxyManager';
import {ProxyChecker} from "./ProxyChecker";

let redisURL = process.env.REDIS_URL || '//127.0.0.1:6379';
let redisClient = Redis.createClient(redisURL);
let appPort = parseInt(process.env.port || '8080');

const redisProxyManager = new RedisProxyManager(redisClient);
const app = new App(redisProxyManager);
const meterApi = new Swagger.MeterApi();
const scrappers = [
    require('./scrappers/GatherProxyScrapper').GatherProxyScrapper,
    require('./scrappers/GatherProxySocksScrapper').GatherProxySocksScrapper
];

let uncheckedProxyGrabber = new UncheckedProxyGrabber({scrappers: scrappers});
let proxyChecker = new ProxyChecker(redisProxyManager, meterApi);

app.listen(appPort).then(() => {
    scheduler.scheduleJob(`*/${process.env.GRAB_TIMEOUT} * * * *`, async () => {
        let newProxies = await uncheckedProxyGrabber.grab();
        redisProxyManager.addProxies(newProxies);
    });

    scheduler.scheduleJob(`*/${process.env.CHECK_TIMEOUT} * * * *`, () => {
        proxyChecker.checkProxies();
    });
}, () => {
    process.exit();
});

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});