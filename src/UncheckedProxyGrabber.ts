import {IProxy} from "./interfaces/IProxy";
import {IScrapper} from "./interfaces/IScrapper";
import {Proxy} from "./models/Proxy"
import * as _ from 'lodash';

const mapper = (scrappers) => _.map(scrappers, (scrapper) => {
    return scrapper.scrape();
});


class UncheckedProxyGrabber {
    private scrappers: Array<IScrapper>;

    public constructor(opts) {
        opts = _.defaults(opts, {scrappers: {}});
        this.scrappers = opts.scrappers;
    }

    private grab() : Promise<Array<IProxy>> {
        let promises = Promise.all(mapper(this.scrappers));

        return promises.then((data) => {
            return _(data)
                .flatten()
                .uniqBy('server')
                .value();
        }, (reason) => {
            throw new Error(`Scrappers failed. Reason: ${reason}`);
        });
    }

    public async populate() {
        let grabbedProxies = await this.grab();
        let existing = await Proxy.findAll();
        let newProxies = _.differenceBy(grabbedProxies, existing, 'server');
        if (_.size(newProxies))
            await Proxy.bulkCreate(newProxies, {validate: true});
    }
}

export {UncheckedProxyGrabber};