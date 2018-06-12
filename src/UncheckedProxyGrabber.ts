import { IProxy } from "./interfaces/IProxy";
import { IScrapper } from "./interfaces/IScrapper";
import { Proxy } from "./models/Proxy"
import * as _ from 'lodash';
import { logger } from "./logger";


class UncheckedProxyGrabber {
    private scrappers : Array<IScrapper>;

    public constructor(opts) {
        opts = _.defaults(opts, { scrappers: {} });
        this.scrappers = opts.scrappers;
    }

    private async grab() : Promise<Array<IProxy>> {
        try {
            let data = await Promise.all(this.mapScrappers(this.scrappers));
            return _(data)
                .flatten()
                .uniqBy('server')
                .value();
        } catch (e) {
            logger.error(e);
            return [];
        }
    }

    public async populate() {
        logger.debug('Started population of unchecked proxies');
        try {
            let grabbedProxies = await this.grab();
            let existing = await Proxy.findAll();
            let newProxies = _.differenceBy(grabbedProxies, existing, 'server');

            if (_.size(newProxies)) {
                logger.debug(`Adding ${_.size(newProxies)} new proxies`);
                await Proxy.bulkCreate(newProxies, { validate: true, fields: ['server', 'port'] });
            }
        } catch (e) {
            logger.error(e);
        }
    }

    private mapScrappers(scrappers : Array<IScrapper>) : Array<Promise<Array<IProxy>>> {
        return _.map(scrappers, (scrapper) => {
            return scrapper.scrape();
        });
    }
}

export { UncheckedProxyGrabber };