import GatherProxyScrapper from "./GatherProxyScrapper";

export default class GatherProxySocksScrapper extends GatherProxyScrapper {
    public getProviderUrl(): string {
        return 'http://www.gatherproxy.com/ru/sockslist';
    }

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
