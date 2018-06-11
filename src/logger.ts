import * as winston from "winston";
import * as WinstonGraylog2 from "winston-graylog2";

const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.simple()
    ),
    exitOnError: false,
    transports: [
        new WinstonGraylog2({
            name: 'Graylog',
            level: 'info',
            handleExceptions: true,
            prelog: msg => msg.trim(),
            graylog: {
                servers: [{
                    host: process.env.GRAYLOG_SERVER,
                    port: process.env.GRAYLOG_PORT
                }],
                hostname: 'X.Scraper',
                facility: 'X.Scraper',
                bufferSize: 1400
            }
        })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        level: 'debug',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.simple()
        ),
    }));

    logger.add(new winston.transports.File({ filename: 'error.log', level: 'info', handleExceptions: true }));

    process.on('unhandledRejection', (reason, p) => {
        logger.error(`Unhandled Rejection at: Promise ${p} reason: ${reason}`);
    });

    process.on('uncaughtException', function (exception) {
        logger.error(`Unhandled exception ${exception}`);
    });
}

export { logger };