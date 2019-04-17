import { IProxy } from "../interfaces/IProxy"
import { IScrapper } from "../interfaces/IScrapper"
import * as phantom from 'phantom'
import * as cheerio from 'cheerio'
import { Proxy } from "../models/Proxy"
import { proxyToPhantomOptions } from "../utils"
import { Sequelize } from "sequelize-typescript"

export default abstract class SpysScrapper implements IScrapper {
    /**
     * @returns {Promise<IProxy[]>}
     */
    async scrape(): Promise<IProxy[]> {
        const proxyServer = await Proxy.findOne({
            where: { lossRatio: { [Sequelize.Op.ne]: 1 } },
            order: [Sequelize.fn('RANDOM')],
            attributes: ['server', 'port', 'protocol']
        });

        const proxy = proxyToPhantomOptions(proxyServer);
        const instance: phantom.PhantomJS = await phantom.create(Math.random() > 0.5 ? [] : proxy);
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

    /**
     * @returns {string}
     */
    getProviderUrl(): string {
        return 'http://spys.one/proxies/';
    }

    /**
     * @param {stirng} data
     * @returns {IProxy}
     */
    protected converter(data: string): IProxy {
        const [server, port] = data.split(':');

        return {
            server,
            port,
            checkedTimes: 0,
            passedTimes: 0
        };
    }

    /**
     * @returns {string}
     */
    abstract getName(): string;

    /**
     * @param {phantom.WebPage} page
     * @param {string} session
     * @returns {Promise<IProxy[]>}
     */
    protected async abstract parse(page: phantom.WebPage, session: string): Promise<IProxy[]>;
}
