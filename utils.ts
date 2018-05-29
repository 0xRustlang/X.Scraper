const Swagger = require('./generated');
const _ = require('lodash');
import ProxyModel from './models';

function proxiesToSwagger(proxies: Array<ProxyModel>) {
    return _.map(proxies, (proxy) => {
        return new Swagger.Proxies(proxy.server, proxy.port);
    })
}

_.mixin({'proxiesToSwagger': proxiesToSwagger});

module.exports = {
    proxiesToSwagger: proxiesToSwagger
};
