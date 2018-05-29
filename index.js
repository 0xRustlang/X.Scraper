require('dotenv').config();
const _ = require('lodash');
const scheduler = require('node-schedule');
const express = require('express');
const Swagger = require('./generated');
const UncheckedProxyGrabber = require('./UncheckedProxyGrabber');
const RedisProxyManager = require('./RedisProxyManager');
const meterApi = new Swagger.MeterApi();

const scrappers = [
    require('./scrappers/GatherProxyScrapper'),
    require('./scrappers/GatherProxySocksScrapper')
];

let uncheckedProxyGrabber = new UncheckedProxyGrabber({scrappers: scrappers});
scheduler.scheduleJob(`*/${process.env.UNCHECKED_TIMEOUT} * * * *`, () => {
    uncheckedProxyGrabber.grab();
});

uncheckedProxyGrabber.emitter.on('new_data', () => {
    let toCheck = uncheckedProxyGrabber.getUnchecked();
    meterApi.checkReliability({proxies: toCheck})
        .then((data) => {
            uncheckedProxyGrabber.clearChecked(toCheck); // we have succesfully checked some. remove from unchecked queue
            data = _(data)
                .filter((proxy) => { // filter dead
                    return proxy.ratios.some((ratio) => {
                        return ratio.loss_ratio !== 1;
                    });
                })
                .value();

            RedisProxyManager.addProxies(data);
            console.log(`Successfully checked ${toCheck.length} proxies. Adding to base ${data.length} live proxies`);
        })
        .catch((reason) => {
            console.log(`Failed to check proxies. Reason: ${reason}`);
        });
});

let app = express();
app.listen(process.env.PORT, () => {
    console.log(`Listening on ${process.env.PORT}`);
});

app.get('/proxy', (req, res) => {
    //EXAMPLE
    let example = [{
        server: '127.0.0.1',
        port: '1080',
        iso_code: 'CN',
        ratios: [{
            protocol: 'socks5',
            ping_time_ms: 25,
            loss_ratio: 0
        }]
    }];

    return res.json(example);
});
