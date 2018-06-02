require('dotenv').config({path: '../.env'});
import xMeter = require('./xmeterapi/api');
import scheduler = require('node-schedule');
import {App} from './App';
import {UncheckedProxyGrabber} from './UncheckedProxyGrabber';
import {ProxyChecker} from "./ProxyChecker";
import {sequelize} from "./Sequelize";
import {Proxy} from "./models/Proxy"
import * as _ from 'lodash';


let appPort = parseInt(process.env.PORT || '8080');
const app = new App();
const meterApi = new xMeter.MeterApi(process.env.XMETER_USERNAME, process.env.XMETER_PASSWORD);

const scrappers = [
    require('./scrappers/GatherProxyScrapper').GatherProxyScrapper,
    require('./scrappers/GatherProxySocksScrapper').GatherProxySocksScrapper
].map(scrapper => new scrapper());

let uncheckedProxyGrabber = new UncheckedProxyGrabber({scrappers: scrappers});
let proxyChecker = new ProxyChecker(meterApi);

app.listen(appPort).then(async () => {
    try {
        await sequelize.sync();
        console.log(`DB connected`);
    } catch (e) {
        console.log(`DB failed to connect. Reason: ${e}`);
        process.exit();
    }

    scheduler.scheduleJob(`*/${process.env.GRAB_TIMEOUT} * * * *`, async () => {
        let grabbedProxies = await uncheckedProxyGrabber.grab();
        try {
            let existing = await Proxy.findAll();
            let newProxies = _.differenceBy(grabbedProxies, existing, 'server');
            if (_.size(newProxies))
                Proxy.bulkCreate(newProxies, {validate: true});
        } catch (e) {
            console.log(e);
        }
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