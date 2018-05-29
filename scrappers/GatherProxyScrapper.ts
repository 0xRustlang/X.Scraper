import BaseScrapper from './BaseScrapper';
const artoo = require('artoo-js');
const request = require('request');
const cheerio = require('cheerio');

artoo.bootstrap(cheerio);

function antiScrapper(string) {
    string = string.trim();
    if (string.startsWith('gp'))
        string = string.replace(/gp.insertPrx\((.*?)\);/, '$1');
    let proxyRaw = JSON.parse(string);
    return {
        server: proxyRaw.PROXY_IP,
        port: parseInt(proxyRaw.PROXY_PORT, 16).toString()
    };
}

class GatherProxyScrapper extends BaseScrapper {
    static scrape() {
        return new Promise(
            (resolve, reject) => {
                request(this.providerUrl, (err, response, body) => {
                    if (err) return reject(err);

                    let $ = cheerio.load(body);
                    let proxyList = $('#tblproxy [type="text/javascript"]')
                                    .scrape({
                                        proxy: {
                                            method: function ($) {
                                                return antiScrapper($(this).text());
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

    static get providerUrl() {
        return 'http://www.gatherproxy.com/ru';
    }
}


module.exports = GatherProxyScrapper;