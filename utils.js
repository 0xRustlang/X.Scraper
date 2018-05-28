const Swagger = require('./generated');
const _ = require('lodash');

function proxiesToSwagger(proxies) {
    return _.map(proxies, (proxy) => {
        return new Swagger.Proxies(proxy.server, proxy.port);
    })
}

_.mixin({'proxiesToSwagger': proxiesToSwagger});

module.exports = {
    proxiesToSwagger: proxiesToSwagger
};
