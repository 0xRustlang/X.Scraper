import { IProxy } from "../interfaces/IProxy";
import { IScrapper } from "../interfaces/IScrapper";
import * as phantom from 'phantom';
import * as artoo from 'artoo-js';
import * as cheerio from 'cheerio';

artoo.bootstrap(cheerio);

const noLog = () => { };

class GatherProxyScrapper implements IScrapper {
    public async scrape() : Promise<Array<IProxy>> {
        const phantomInstance = await phantom.create([], { logger: { info: noLog, warn: noLog, error: noLog, debug: noLog } });
        const page = await phantomInstance.createPage();

        const status = await page.open(this.getProviderUrl());

        if (status !== 'success') {
            throw new Error('Failed to load the page');
        }

        let content = await page.property('content');
        let $ = cheerio.load(content);

        let result = $('#tblproxy tr')
            .scrape(this.scrapeParams)
            .splice(2);

        await phantomInstance.exit();
        return result;
    }

    public getProviderUrl() : string {
        return 'http://www.gatherproxy.com/ru';
    }

    protected get scrapeParams() : object {
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

export { GatherProxyScrapper };