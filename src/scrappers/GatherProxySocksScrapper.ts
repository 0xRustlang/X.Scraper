import {IProxy} from "../interfaces/IProxy";
import {IScrapper} from "../interfaces/IScrapper";

const _ = require('lodash');
const artoo = require('artoo-js');
const request = require('request');
const cheerio = require('cheerio');

artoo.bootstrap(cheerio);

class GatherProxySocksScrapper implements IScrapper {
    public scrape(): Promise<Array<IProxy>> {
        return new Promise(
            (resolve, reject) => {
                request(this.getProviderUrl(), (err, response, body) => {
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

    private antiScrapperFix(string: string) : string {
        string = string.trim();
        if (string.startsWith('document'))
            string = string.replace(/document.write\('(.*?)'\)/, '$1');
        return string;
    }

    public getProviderUrl() : string {
        return 'http://www.gatherproxy.com/ru/sockslist';
    }
}


export {GatherProxySocksScrapper};