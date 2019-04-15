import * as winston from "winston"

const logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.simple()
    ),
    exitOnError: false,
    transports: [
        new winston.transports.Console({
            level: 'info'
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

export default logger;
