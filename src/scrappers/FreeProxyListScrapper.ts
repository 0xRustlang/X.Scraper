import { IProxy } from "../interfaces/IProxy";
import { IScrapper } from "../interfaces/IScrapper";
import * as phantom from 'phantom';
import * as _ from 'lodash';
import * as artoo from 'artoo-js';
import * as cheerio from 'cheerio';

artoo.bootstrap(cheerio);

const noLog = () => { };

class FreeProxyListScrapper implements IScrapper {
    public async scrape(pageLimit : number = Number.MAX_SAFE_INTEGER) : Promise<Array<IProxy>> {
        let limitCounter = pageLimit;

        const phantomInstance = await phantom.create([], { logger: { info: noLog, warn: noLog, error: noLog, debug: noLog } });
        const page = await phantomInstance.createPage();

        const status = await page.open(this.getProviderUrl());

        if (status !== 'success') {
            throw new Error('Failed to load the page');
        }

        let result = [];
        let buttonClasses = [];

        do {
            let content = await page.property('content');
            result = result.concat(this.parsePage(content));

            buttonClasses = await page.evaluate(function () {
                return document.getElementById('proxylisttable_next').classList;
            });

            await page.evaluate(function () {
                return document.getElementById('proxylisttable_next').click()
            });

            limitCounter -= 1;
        } while (!_.includes(buttonClasses, 'disabled') && limitCounter >= 0);

        await phantomInstance.exit();

        return result;
    }

    private parsePage(page : string) : Array<IProxy> {
        let $ = cheerio.load(page);
        return $('#proxylisttable tbody tr')
            .scrape({
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

    public getProviderUrl() : string {
        return 'https://free-proxy-list.net/';
    }
}

export { FreeProxyListScrapper };