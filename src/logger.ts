import * as winston from "winston";
import * as WinstonGraylog2 from "winston-graylog2";

const logger = winston.createLogger({
    levels: winston.config.syslog.levels,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.simple()
    ),
    exitOnError: false,
    transports: [
        new winston.transports.File({filename: 'error.log', level: 'notice', handleExceptions: true}),
        new WinstonGraylog2({
            name: 'Graylog',
            level: 'notice',
            handleExceptions: true,
            prelog: function (msg) {
                return msg.trim();
            },
            graylog: {
                servers: [{
                    host: process.env.GRAYLOG_SERVER,
                    port: process.env.GRAYLOG_PORT
                }],
                hostname: 'X.Scrapper',
                facility: 'X.Scrapper',
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

    process.on('unhandledRejection', (reason, p) => {
        logger.error(`Unhandled Rejection at: Promise ${p} reason: ${reason}`);
    });
}

export {logger};