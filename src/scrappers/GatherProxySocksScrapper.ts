import { GatherProxyScrapper } from "./GatherProxyScrapper";

class GatherProxySocksScrapper extends GatherProxyScrapper {
    public getProviderUrl() : string {
        return 'http://www.gatherproxy.com/ru/sockslist';
    }

    protected get scrapeParams() : object {
        let justText = function($) {
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
                method: justText
            },
            port: {
                sel: 'td:nth-child(3)',
                method: justText
            }
        };
    }
}

export { GatherProxySocksScrapper };