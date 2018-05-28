const _ = require('lodash');
const BaseScrapper = require('./BaseScrapper');
const artoo = require('artoo-js');
const request = require('request');
const cheerio = require('cheerio');

artoo.bootstrap(cheerio);

function antiScrapperFix(string) {
    string = string.trim();
    if (string.startsWith('document'))
        string = string.replace(/document.write\('(.*?)'\)/, '$1');
    return string;
}

class GatherProxySocksScrapper extends BaseScrapper {
    static scrape() {
        return new Promise(
            (resolve, reject) => {
                request(this.providerUrl, (err, response, body) => {
                    if (err) return reject(err);

                    let $ = cheerio.load(body);
                    let proxyList = $('#tblproxy tr')
                                    .scrape({
                                        ip: {
                                            sel: 'td:nth-child(2)',
                                            method: function ($) {
                                                return antiScrapperFix($(this).text());
                                            }
                                        },
                                        port: {
                                            sel: 'td:nth-child(3)',
                                            method: function ($) {
                                                return antiScrapperFix($(this).text());
                                            }
                                        }
                                    })
                                    .splice(2);

                    resolve(proxyList);
                });
            });
    }

    static get providerUrl() {
        return 'http://www.gatherproxy.com/ru/sockslist';
    }
}


module.exports = GatherProxySocksScrapper;