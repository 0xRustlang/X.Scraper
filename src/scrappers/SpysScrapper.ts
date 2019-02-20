import { IProxy } from "../interfaces/IProxy";
import { IScrapper } from "../interfaces/IScrapper";
import * as phantom from 'phantom';
import * as cheerio from 'cheerio';
import * as querystring from 'querystring';

export default class SpysScrapper implements IScrapper {
    public async scrape(): Promise<Array<IProxy>> {
        const phantomInstance = await phantom.create([], { logLevel: 'error' });
        const page = await phantomInstance.createPage();
        const preflightStatus = await page.open(this.getProviderUrl());

        let result = [];

        if (preflightStatus === 'success') {
            const preflightContent = await page.property('content');
            const $ = cheerio.load(preflightContent);
            const session = $('[name=xf0]').attr('value');

            const converter = (data: string): IProxy => {
                const [server, port] = data.split(':');

                return {
                    server,
                    port,
                    checkedTimes: 0
                };
            };

            const status = await page.open(
                this.getProviderUrl(), 'POST', querystring.stringify({
                    xf0: session,
                    xpp: 5,
                    xf1: 0,
                    xf2: 0,
                    xf4: 0,
                    xf5: 0
                })
            );

            if (status === 'success') {
                const content = await page.property('content');
                const $$ = cheerio.load(content);

                result = $$('body')
                    .text()
                    .match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{1,5}/g)
                    .map(converter);
            }
        }

        await phantomInstance.exit();

        return result;
    }

    public getProviderUrl(): string {
        return 'http://spys.one/proxies/';
    }
}