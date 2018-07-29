import { Sequelize } from 'sequelize-typescript';
import { logger } from "./logger";

export const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    modelPaths: [__dirname + '/models'],
    logging: (process.env.NODE_ENV !== 'production')
        ? (msg) => logger.debug(msg)
        : () => { }
});
