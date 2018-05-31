import _ = require('lodash');
import {IProxy} from "./interfaces/IProxy";
import {IScrapper} from "./interfaces/IScrapper";

const mapper = (scrappers) => _.map(scrappers, (scrapper) => {
    return scrapper.scrape();
});


class UncheckedProxyGrabber {
    private scrappers: Array<IScrapper>;

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

export {UncheckedProxyGrabber};