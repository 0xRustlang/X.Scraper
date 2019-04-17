import { IProxy } from "../interfaces/IProxy"
import { IScrapper } from "../interfaces/IScrapper"
import * as phantom from 'phantom'
import * as _ from 'lodash'
import * as artoo from 'artoo-js'
import * as cheerio from 'cheerio'

artoo.bootstrap(cheerio);

export default class FreeProxyListScrapper implements IScrapper {
    /**
     * @param {number} pageLimit
     * @returns {Promise<IProxy[]>}
     */
    async scrape(pageLimit: number = 100): Promise<IProxy[]> {
        let limitCounter = pageLimit;
        let result = [];

        const phantomInstance = await phantom.create([], { logLevel: 'error' });
        const page = await phantomInstance.createPage();
        const status = await page.open(this.getProviderUrl());

        if (status === 'success') {
            let buttonClasses = [];

            do {
                const content = await page.property('content');
                result = result.concat(FreeProxyListScrapper.parsePage(content));

                buttonClasses = await page.evaluate(function () {
                    return document.getElementById('proxylisttable_next').classList;
                });

                if (!buttonClasses) {
                    break;
                }

                await page.evaluate(function () {
                    return document.getElementById('proxylisttable_next').click()
                });

                limitCounter--;
            } while (!_.includes(buttonClasses, 'disabled') && limitCounter >= 0);
        }

        await phantomInstance.exit();

        return result;
    }

    /**
     * @returns {string}
     */
    getProviderUrl(): string {
        return 'https://free-proxy-list.net';
    }

    /**
     * @returns {string}
     */
    getName(): string {
        return 'FreeProxyList';
    }

    /**
     * @param {string} page
     * @returns {IProxy[]}
     */
    private static parsePage(page: string): IProxy[] {
        const $ = cheerio.load(page);

        return $('#proxylisttable tbody tr').scrape({
            server: {
                sel: 'td:nth-child(1)',
                method: 'text'
            },
            port: {
                sel: 'td:nth-child(2)',
                method: 'text'
            }
        });
    }
}
