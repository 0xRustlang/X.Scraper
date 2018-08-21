import { IProxy } from "./interfaces/IProxy";
import { IScrapper } from "./interfaces/IScrapper";
import { Proxy } from "./models/Proxy"
import * as _ from 'lodash';
import { logger } from "./logger";

class UncheckedProxyGrabber {
    private readonly scrappers : Array<IScrapper>;

    public constructor(opts) {
        opts = _.defaults(opts, { scrappers: {} });
        this.scrappers = opts.scrappers;
    }

    private async grab() : Promise<Array<IProxy>> {
        try {
            let data = await Promise.all(UncheckedProxyGrabber.mapScrappers(this.scrappers));
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
            let newProxies = _.differenceBy(grabbedProxies, existing, (value) => `${value.server}:${value.port}`);

            if (_.size(newProxies)) {
                logger.debug(`Adding ${_.size(newProxies)} new proxies`);
                await Proxy.bulkCreate(newProxies, { validate: true, fields: ['server', 'port'] });
            }
        } catch (e) {
            logger.error(e);
        }
    }

    private static mapScrappers(scrappers : Array<IScrapper>) : Array<Promise<Array<IProxy>>> {
        return _.map(scrappers, scrapper => scrapper.scrape());
    }
}

export { UncheckedProxyGrabber };
