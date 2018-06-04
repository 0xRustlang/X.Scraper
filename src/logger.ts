import * as winston from "winston";
import * as WinstonGraylog2 from "winston-graylog2";
import * as Elasticsearch from "winston-elasticsearch";

const logger = winston.createLogger({
    levels: winston.config.syslog.levels,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.simple()
    ),
    exitOnError: false,
    transports: [
        new winston.transports.File({filename: 'error.log', level: 'notice', handleExceptions: true}),
        // new Elasticsearch({
        //     level: 'notice',
        //     handleExceptions: true,
        //     clientOpts: {
        //         host: process.env.ELASTIC_SERVER
        //     }
        // })
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