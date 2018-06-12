require('dotenv').config({ path: '.env' });

import { logger } from "./logger";
import { App } from './xscraperapi/App';
import { UncheckedProxyGrabber } from './UncheckedProxyGrabber';
import { ProxyChecker } from "./ProxyChecker";
import { sequelize } from "./Sequelize";
import xMeter = require('./xmeterapi/api');
import scheduler = require('node-schedule');


let appPort = parseInt(process.env.PORT || '8080');
const app = new App();
const meterApi = new xMeter.MeterApi(process.env.XMETER_USERNAME, process.env.XMETER_PASSWORD, process.env.XMETER_HOST);

const scrappers = [
    require('./scrappers/GatherProxyScrapper').GatherProxyScrapper,
    require('./scrappers/GatherProxySocksScrapper').GatherProxySocksScrapper,
    require('./scrappers/FreeProxyListScrapper').FreeProxyListScrapper
].map(scrapper => new scrapper());

let uncheckedProxyGrabber = new UncheckedProxyGrabber({ scrappers: scrappers });
let proxyChecker = new ProxyChecker(meterApi);

app.listen(appPort).then(async () => {
    try {
        await sequelize.sync();
        logger.debug(`DB connected`);
    } catch (e) {
        logger.debug(`DB failed to connect. Reason: ${e}`);
        process.exit(1);
    }

    scheduler.scheduleJob(`*/${process.env.GRAB_TIMEOUT} * * * *`, async () => {
        await uncheckedProxyGrabber.populate();
    });

    scheduler.scheduleJob(`*/${process.env.CHECK_TIMEOUT} * * * *`, async () => {
        await proxyChecker.checkProxies();
    });
}, () => {
    process.exit();
});
