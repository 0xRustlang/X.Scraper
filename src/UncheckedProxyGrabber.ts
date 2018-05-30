import _ = require('lodash');
import BaseScrapper from "./scrappers/BaseScrapper";
import {IProxy} from "./interfaces/IProxy";

const mapper = (scrappers) => _.map(scrappers, (scrapper) => {
    return scrapper.scrape();
});


class UncheckedProxyGrabber {
    private scrappers: Array<BaseScrapper>;

    public constructor(opts) {
        opts = _.defaults(opts, {scrappers: {}});
        this.scrappers = opts.scrappers;
    }

    public grab() : Promise<Array<IProxy>> {
        let promises = Promise.all(mapper(this.scrappers));

        return promises.then((data) => {
            return _(data)
                .flatten()
                .value();
        }, (reason) => {
            console.log(`Scrappers failed. Reason: ${reason}`);
        });
    }
}

export default UncheckedProxyGrabber;