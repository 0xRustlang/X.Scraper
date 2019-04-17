import { IProxy } from "../interfaces/IProxy"
import { IScrapper } from "../interfaces/IScrapper"
import * as phantom from 'phantom'
import * as artoo from 'artoo-js'
import * as cheerio from 'cheerio'

artoo.bootstrap(cheerio);

export default class GatherProxyScrapper implements IScrapper {
    /**
     * @returns {Promise<IProxy[]>}
     */
    async scrape(): Promise<IProxy[]> {
        const phantomInstance = await phantom.create([], { logLevel: 'error' });
        const page = await phantomInstance.createPage();
        const status = await page.open(this.getProviderUrl());

        let results = [];

        if (status === 'success') {
            const content = await page.property('content');
            const $ = cheerio.load(content);

            results = $('#tblproxy tr')
                .scrape(this.scrapeParams)
                .splice(2);
        }

        await phantomInstance.exit();

        return results;
    }

    /**
     * @returns {string}
     */
    getProviderUrl(): string {
        return 'http://www.gatherproxy.com/ru';
    }

    /**
     * @returns {string}
     */
    getName(): string {
        return 'GatherProxy';
    }

    /**
     * @returns {object}
     */
    protected get scrapeParams(): object {
        return {
            server: {
                sel: 'td:nth-child(2)',
                method: 'text'
            },
            port: {
                sel: 'td:nth-child(3)',
                method: 'text'
            }
        };
    }
}
