require('dotenv').config();

const scrappers = [
    require('./scrappers/GatherProxyScrapper'),
    require('./scrappers/GatherProxySocksScrapper')
];
const scheduler = require('node-schedule');
const express = require('express');
const Swagger = require('./generated');
const UncheckedProxyGrabber = require('./UncheckedProxyGrabber');
const meterApi = new Swagger.MeterApi();

let uncheckedProxyGrabber = new UncheckedProxyGrabber({scrappers: scrappers});
scheduler.scheduleJob(`*/${process.env.UNCHECKED_TIMEOUT} * * * *`, () => {
    uncheckedProxyGrabber.grab();
});

uncheckedProxyGrabber.emitter.on('new_data', () => {
    let toCheck = uncheckedProxyGrabber.getUnchecked();
    //TODO: MAKE CHECK REQUEST
    uncheckedProxyGrabber.clearChecked(toCheck); // if success
});
