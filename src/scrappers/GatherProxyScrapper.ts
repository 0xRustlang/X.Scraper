import {IProxy} from "../interfaces/IProxy";
import {IScrapper} from "../interfaces/IScrapper";

const artoo = require('artoo-js');
const request = require('request');
const cheerio = require('cheerio');

artoo.bootstrap(cheerio);

class GatherProxyScrapper implements IScrapper {
    public scrape() : Promise<Array<IProxy>> {
        return new Promise(
            (resolve, reject) => {
                request(this.getProviderUrl(), (err, response, body) => {
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

    private antiScrapper(string: string) {
        string = string.trim();
        if (string.startsWith('gp'))
            string = string.replace(/gp.insertPrx\((.*?)\);/, '$1');
        let proxyRaw = JSON.parse(string);
        return {
            server: proxyRaw.PROXY_IP,
            port: parseInt(proxyRaw.PROXY_PORT, 16).toString()
        };
    }

    public getProviderUrl() {
        return 'http://www.gatherproxy.com/ru';
    }
}


export {GatherProxyScrapper};