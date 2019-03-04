import { IProxy } from "../interfaces/IProxy";
import { IScrapper } from "../interfaces/IScrapper";
import * as phantom from 'phantom';
import * as cheerio from 'cheerio';

export default abstract class SpysScrapper implements IScrapper {
    public async scrape(): Promise<Array<IProxy>> {
        const instance: phantom.PhantomJS = await phantom.create([], { logLevel: 'error' });
        const page: phantom.WebPage = await instance.createPage();
        const preflightStatus: string = await page.open(this.getProviderUrl());

        let result = [];

        if (preflightStatus === 'success') {
            const preflightContent = await page.property('content');
            const $ = cheerio.load(preflightContent);

            result = await this.parse(page, $('[name=xf0]').attr('value'));
        }

        await instance.exit();

        return result;
    }

    public getProviderUrl(): string {
        return 'http://spys.one/proxies/';
    }

    protected converter(data: string): IProxy {
        const [server, port] = data.split(':');

        return {
            server,
            port,
            checkedTimes: 0
        };
    }

    protected async abstract parse(page: phantom.WebPage, session: string): Promise<Array<IProxy>>;
}
