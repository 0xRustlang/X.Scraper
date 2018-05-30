import {BaseScrapper} from './BaseScrapper';
import {IProxy} from "../interfaces/IProxy";

const artoo = require('artoo-js');
const request = require('request');
const cheerio = require('cheerio');

artoo.bootstrap(cheerio);

class GatherProxyScrapper extends BaseScrapper {
    public static scrape() : Promise<Array<IProxy>> {
        return new Promise(
            (resolve, reject) => {
                request(this.providerUrl, (err, response, body) => {
                    if (err) return reject(err);

                    let self = this;
                    let $ = cheerio.load(body);
                    let proxyList = $('#tblproxy [type="text/javascript"]')
                        .scrape({
                            proxy: {
                                method: function ($) {
                                    return self.antiScrapper($(this).text());
                                }
                            }
                        })
                        .map((proxyNode) => {
                            return proxyNode.proxy;
                        });

                    resolve(proxyList);
                });
            });
    }

    private static antiScrapper(string: string) {
        string = string.trim();
        if (string.startsWith('gp'))
            string = string.replace(/gp.insertPrx\((.*?)\);/, '$1');
        let proxyRaw = JSON.parse(string);
        return {
            server: proxyRaw.PROXY_IP,
            port: parseInt(proxyRaw.PROXY_PORT, 16).toString()
        };
    }

    private static get providerUrl() {
        return 'http://www.gatherproxy.com/ru';
    }
}


export {GatherProxyScrapper};