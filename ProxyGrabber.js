const _ = require('lodash');
const EventEmitter = require('events');

const mapper = (scrappers) => _.map(scrappers, (scrapper) => {
    return scrapper.scrape();
});


class ProxyGrabber {
    constructor(opts) {
        opts = _.defaults(opts, {timeout: 10 * 60 * 1000, scrappers: {}});
        this.timeout = opts.timeout;
        this.scrappers = opts.scrappers;

        this.uncheckeds = [];
        this.emitter = new EventEmitter();
    }

    startGrabbing() {
        this.grab();
        setTimeout(this.grab, this.timeout);
    }

    grab() {
        let promises = Promise.all(mapper(this.scrappers));

        promises.then((data) => {
            let newProxy = _(data)
                .flatten()
                .merge(this.uncheckeds)
                .uniqWith(_.isEqual)
                .value();

            let diff = _.differenceWith(newProxy, this.uncheckeds, _.isEqual);
            this.uncheckeds = newProxy;

            if (_.size(diff)) {
                this.emitter.emit('new_data');
            }

        }, (reason) => {
            console.log(`Scrappers failed. Reason: ${reason}`);
        });
    }
}

module.exports = ProxyGrabber;