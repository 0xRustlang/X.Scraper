import { IProxy } from "./interfaces/IProxy"
import { IScrapper } from "./interfaces/IScrapper"
import { Proxy } from "./models/Proxy"
import * as _ from 'lodash'
import logger from "./logger"
import FreeProxyListScrapper from "./scrappers/FreeProxyListScrapper"
import GatherProxyScrapper from "./scrappers/GatherProxyScrapper"
import GatherProxySocksScrapper from "./scrappers/GatherProxySocksScrapper"
import SpysHTTPScrapper from "./scrappers/SpysHTTPScrapper"
import SpysSOCKSScrapper from "./scrappers/SpysSOCKSScrapper"

export default class UncheckedProxyGrabber {
    /** @property Array<IScrapper> scrappers **/
    private readonly scrappers: Array<IScrapper>;

    /**
     * @param {IScrapper[]} scrapper
     */
    constructor(...scrapper: IScrapper[]) {
        this.scrappers = scrapper;
    }

    /**
     * @returns {UncheckedProxyGrabber}
     */
    static create(): UncheckedProxyGrabber {
        return new UncheckedProxyGrabber(
            new FreeProxyListScrapper(),
            new GatherProxyScrapper(),
            new GatherProxySocksScrapper(),
            new SpysHTTPScrapper(),
            new SpysSOCKSScrapper()
        );
    }

    /**
     * @returns {Promise<IProxy[]>}
     */
    async grab(): Promise<IProxy[]> {
        try {
            const data = await Promise.all(this.mapScrappers(this.scrappers));

            return _(data).flatten().uniqBy('server').value();
        } catch (e) {
            logger.error(e);
            return [];
        }
    }

    /**
     * @returns {Promise<void>}
     */
    async populate(): Promise<void> {
        logger.debug('Started population of unchecked proxies');

        const grabbedProxies = await this.grab();
        const existing = await Proxy.findAll();
        const newProxies = _.differenceBy(grabbedProxies, existing, (value) => `${value.server}:${value.port}`);

        if (_.size(newProxies)) {
            logger.debug(`Adding ${_.size(newProxies)} new proxies`);
            await Proxy.bulkCreate(newProxies, { validate: true, fields: ['server', 'port'] });
        }
    }

    /**
     * @param {IScrapper[]} scrappers
     * @returns {Promise<IProxy[]>[]}
     */
    mapScrappers(scrappers: IScrapper[]): Promise<IProxy[]>[] {
        return scrappers.map(scrapper => Promise.race([scrapper.scrape(), this.createTimeout()]).catch(e => {
            logger.error(e);
            return []
        }));
    }

    /**
     * @returns {Promise<any>}
     */
    createTimeout(): Promise<any> {
        return new Promise((_, reject) => setTimeout(reject, 40000, 'Timeout'));
    }
}
