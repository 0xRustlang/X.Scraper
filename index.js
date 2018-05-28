const scrappers = [
    require('./scrappers/GatherProxyScrapper'),
    require('./scrappers/GatherProxySocksScrapper')
];
const express = require('express');
const Swagger = require('./generated');
const ProxyGrabber = require('./ProxyGrabber');
const meterApi = new Swagger.MeterApi();


let proxyGrabber = new ProxyGrabber({scrappers: scrappers});
proxyGrabber.startGrabbing();

