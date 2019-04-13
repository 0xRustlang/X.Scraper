import { IProxy } from "./interfaces/IProxy";
import { IScrapper } from "./interfaces/IScrapper";
import { Proxy } from "./models/Proxy"
import * as _ from 'lodash';
import logger from "./logger";

export default class UncheckedProxyGrabber {
    private readonly scrappers: Array<IScrapper>;

    public constructor(...scrapper: IScrapper[]) {
        this.scrappers = scrapper;
    }

    private async grab(): Promise<Array<IProxy>> {
        try {
            const data = await Promise.all(UncheckedProxyGrabber.mapScrappers(this.scrappers));

            return _(data).flatten().uniqBy('server').value();
        } catch (e) {
            logger.error(e);
            if (e.stack) {
                logger.error(e.stack);
            }

            return [];
        }
    }

    public async populate() {
        logger.debug('Started population of unchecked proxies');

        const grabbedProxies = await this.grab();
        const existing = await Proxy.findAll();
        const newProxies = _.differenceBy(grabbedProxies, existing, (value) => `${value.server}:${value.port}`);

        if (_.size(newProxies)) {
            logger.debug(`Adding ${_.size(newProxies)} new proxies`);
            await Proxy.bulkCreate(newProxies, { validate: true, fields: ['server', 'port'] });
        }
    }

    private static mapScrappers(scrappers: Array<IScrapper>): Array<Promise<Array<IProxy>>> {
        return scrappers.map(scrapper => Promise.race([scrapper.scrape(), UncheckedProxyGrabber.createTimeout()]).catch(e => {
            logger.error(e);
            if (e.stack) {
                logger.error(e.stack);
            }

            return []
        }));
    }

    private static createTimeout(): Promise<any> {
        return new Promise((_, reject) => {
            setTimeout(reject, 40000, 'Timeout');
        });
    }
}
