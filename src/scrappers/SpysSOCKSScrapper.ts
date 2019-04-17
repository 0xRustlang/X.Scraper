import SpysScrapper from './SpysScrapper'
import { IProxy } from "../interfaces/IProxy"
import * as cheerio from 'cheerio'
import * as querystring from "querystring"
import * as phantom from 'phantom'

export default class SpysSOCKSScrapper extends SpysScrapper {
    /**
     * @returns {string}
     */
    getName(): string {
        return 'SpysSOCKS';
    }

    /**
     * @param {phantom.WebPage} page
     * @param {string} session
     * @returns {Promise<IProxy[]>}
     */
    protected async parse(page: phantom.WebPage, session: string): Promise<IProxy[]> {
        const status = await page.open(
            this.getProviderUrl(), 'POST', querystring.stringify({
                xf0: session,
                xpp: 5,
                xf1: 0,
                xf2: 0,
                xf4: 0,
                xf5: 2
            })
        );

        if (status === 'success') {
            const content = await page.property('content');
            const $$ = cheerio.load(content);
            const data = $$('body').text().match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{1,5}/g) || [];

            return data.map(this.converter);
        }

        return [];
    }
}
