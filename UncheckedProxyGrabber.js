const _ = require('lodash');
const utils = require('./utils');
const EventEmitter = require('events');

const mapper = (scrappers) => _.map(scrappers, (scrapper) => {
    return scrapper.scrape();
});


class UncheckedProxyGrabber {
    constructor(opts) {
        opts = _.defaults(opts, {scrappers: {}});
        this.scrappers = opts.scrappers;

        this.uncheckeds = [];
        this.emitter = new EventEmitter();
    }

    grab() {
        let promises = Promise.all(mapper(this.scrappers));

        promises.then((data) => {
            let newProxy = _(data)
                .flatten()
                .proxiesToSwagger()
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

    clearChecked(checked) {
        this.uncheckeds = _.differenceWith(this.uncheckeds, checked, _.isEqual);
    }

    getUnchecked() {
        return this.uncheckeds;
    }
}

module.exports = UncheckedProxyGrabber;