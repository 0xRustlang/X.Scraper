import { InfluxDB, IPoint } from "influx"
import { EventEmitter } from "events"
import * as winston from "winston"
import * as express from "express"

interface ExpressMiddlewareOptions {
    batchSize: number;
    influxClient: InfluxDB;
    logger: winston.Logger;
}

export default function expressInfluxMetrics(options: ExpressMiddlewareOptions): any {
    let eventEmitter = new EventEmitter();
    let points: Array<IPoint> = [];

    eventEmitter.on('addPoint', () => {
        if (points.length >= options.batchSize) {
            try {
                options
                    .influxClient
                    .writeMeasurement('requests', points)
                    .then(() => { points = [] })
                    .catch(reason => {
                        const { message } = reason;
                        options.logger.warn(message);
                    });
            } catch (e) {
                options.logger.warn(e.message);
            }

            points = [];
        }
    });

    return (request: express.Request, response: express.Response, next: any) => {
        const requestStartedAt = Date.now();
        const browserName = request.userAgent.getBrowser().name;

        const makePoint = () => {
            const responseTime = Date.now() - requestStartedAt;

            points.push({
                timestamp: new Date(),
                tags: {
                    path: request.path,
                    host: request.hostname,
                    verb: request.method,
                    status: response.statusCode.toString(),
                },
                fields: {
                    responseTime: responseTime,
                    browserName: browserName || 'Unknown',
                    ip: request.ip
                },
            });

            eventEmitter.emit('addPoint')
        };

        const cleanup = () => {
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
