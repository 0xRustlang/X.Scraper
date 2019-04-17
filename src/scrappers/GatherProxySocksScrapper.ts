import GatherProxyScrapper from "./GatherProxyScrapper";

export default class GatherProxySocksScrapper extends GatherProxyScrapper {
    /**
     * @returns {string}
     */
    getProviderUrl(): string {
        return 'http://www.gatherproxy.com/ru/sockslist';
    }

    /**
     * @returns {string}
     */
    getName(): string {
        return 'GatherProxySOCKS';
    }

    /**
     * @returns {object}
     */
    protected get scrapeParams(): object {
        let plainText = function ($) {
            return $(this)
                .clone()
                .children()
                .remove()
                .end()
                .text();
        };

        return {
            server: {
                sel: 'td:nth-child(2)',
                method: plainText
            },
            port: {
                sel: 'td:nth-child(3)',
                method: plainText
            }
        };
    }
}
