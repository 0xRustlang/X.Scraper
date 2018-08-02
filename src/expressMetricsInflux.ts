import { InfluxDB, IPoint } from "influx";
import { EventEmitter } from "events";
import * as winston from "winston";
import * as express from "express";

interface ExpressMiddlewareOptions {
    batchSize: number;
    influxClient: InfluxDB;
    logger: winston.Logger;
}

export function expressInfluxMetrics(options: ExpressMiddlewareOptions): any {
    let eventEmitter = new EventEmitter();
    let points: Array<IPoint> = [];

    eventEmitter.on('addPoint', () => {
        if (points.length >= options.batchSize) {
            options.influxClient
                .writePoints(points)
                .catch(
                    (reason: any) => {
                        options.logger.warn(reason.message);
                    }
                );

            points = []
        }
    });

    return (request: express.Request, response: express.Response, next: any) => {
        let requestStartedAt = Date.now();

        let makePoint = () => {
            let responseTime = Date.now() - requestStartedAt;

            points.push({
                measurement: 'requests',
                tags: {
                    path   : request.path,
                    host   : request.hostname,
                    verb   : request.method,
                    status : response.statusCode.toString(),
                },
                fields: {
                    responseTime: responseTime,
                },
            });

            eventEmitter.emit('addPoint')
        };

        let cleanup = () => {
            response.removeListener('finish', makePoint);
            response.removeListener('error', cleanup);
            response.removeListener('close', cleanup);
        };

        response.once('finish', makePoint);
        response.once('error', cleanup);
        response.once('close', cleanup);

        next();
    };
}
