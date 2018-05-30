import {BaseScrapper} from './BaseScrapper';
import {IProxy} from "../interfaces/IProxy";

const _ = require('lodash');
const artoo = require('artoo-js');
const request = require('request');
const cheerio = require('cheerio');

artoo.bootstrap(cheerio);

class GatherProxySocksScrapper extends BaseScrapper {
    public static scrape(): Promise<Array<IProxy>> {
        return new Promise(
            (resolve, reject) => {
                request(this.providerUrl, (err, response, body) => {
                    if (err) return reject(err);

                    let $ = cheerio.load(body);
                    let self = this;
                    let proxyList = $('#tblproxy tr')
                        .scrape({
                            server: {
                                sel: 'td:nth-child(2)',
                                method: function ($) {
                                    return self.antiScrapperFix($(this).text());
                                }
                            },
                            port: {
                                sel: 'td:nth-child(3)',
                                method: function ($) {
                                    return self.antiScrapperFix($(this).text());
                                }
                            }
                        })
                        .splice(2);

                    resolve(proxyList);
                });
            });
    }

    private static antiScrapperFix(string: string) : string {
        string = string.trim();
        if (string.startsWith('document'))
            string = string.replace(/document.write\('(.*?)'\)/, '$1');
        return string;
    }

    private static get providerUrl() : string {
        return 'http://www.gatherproxy.com/ru/sockslist';
    }
}


export {GatherProxySocksScrapper};