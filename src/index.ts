import * as moment from "moment";

require('dotenv').config({ path: '.env' });

import { logger } from "./logger";
import { App } from './xscraperapi/App';
import { UncheckedProxyGrabber } from './UncheckedProxyGrabber';
import { ProxyChecker } from "./ProxyChecker";
import { sequelize } from "./Sequelize";
import { Scheduler } from "./Scheduler";
import { MeterApi } from './xmeterapi/api';

const appPort = parseInt(process.env.PORT || '8080');
const app = new App();
const meterApi = new MeterApi(process.env.XMETER_USERNAME, process.env.XMETER_PASSWORD, process.env.XMETER_HOST);

const scrappers = [
    require('./scrappers/GatherProxyScrapper').GatherProxyScrapper,
    require('./scrappers/GatherProxySocksScrapper').GatherProxySocksScrapper,
    require('./scrappers/FreeProxyListScrapper').FreeProxyListScrapper
].map(scrapper => new scrapper());

const uncheckedProxyGrabber = new UncheckedProxyGrabber({ scrappers: scrappers });
const proxyChecker = new ProxyChecker(meterApi);

app.listen(appPort).then(async () => {
    try {
        await sequelize.sync();
        logger.debug(`DB connected`);
    } catch (e) {
        logger.debug(`DB failed to connect. Reason: ${e}`);
        process.exit(1);
    }

    try {
        await uncheckedProxyGrabber.populate();
        await proxyChecker.checkProxies();
    } catch (e) {
        if (e.message) {
            logger.error(e.message);
        } else {
            logger.error(JSON.stringify(e));
        }
    }

    Scheduler.schedule(uncheckedProxyGrabber.populate.bind(uncheckedProxyGrabber), moment.duration(process.env.GRAB_TIMEOUT).asMilliseconds());
    Scheduler.schedule(proxyChecker.checkProxies.bind(proxyChecker), moment.duration(process.env.CHECK_TIMEOUT).asMilliseconds());
}, () => {
    process.exit();
});
