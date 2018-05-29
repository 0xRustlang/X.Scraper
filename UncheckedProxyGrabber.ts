import _ = require('lodash');
import BaseScrapper from "./scrappers/BaseScrapper";

const mapper = (scrappers) => _.map(scrappers, (scrapper) => {
    return scrapper.scrape();
});


class UncheckedProxyGrabber {
    scrappers: Array<BaseScrapper>;

    constructor(opts) {
        opts = _.defaults(opts, {scrappers: {}});
        this.scrappers = opts.scrappers;
    }

    grab() {
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

module.exports = UncheckedProxyGrabber;