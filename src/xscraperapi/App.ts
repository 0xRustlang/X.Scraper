import * as express from 'express'
import { Express } from 'express'
import { logger } from "../logger";
import * as expressWinston from 'express-winston';
import * as swaggerize from 'swaggerize-express';
import * as path from "path";

const swaggerApi = require(path.join(process.cwd(), '/xscraperapi', '/swagger.json'));

class App {
    private express : Express;

    constructor() {
        this.express = express();
        this.setLogging();
        this.mountSwagger();
    }

    private setLogging() : void {
        this.express.use(expressWinston.logger({
            meta: true,
            msg: "HTTP {{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}",
            level: 'info',
            winstonInstance: logger
        }));
    }

    private mountSwagger() : void {
        this.express.use(swaggerize({
            api: swaggerApi,
            docspath: '/api-docs',
            handlers: './handlers'
        }));

        this.express.use(swaggerApi.basePath, (err, req, res, next) => {
            res.status(err.status).json(err);
        });

    }

    public listen(port : number) : Promise<any> {
        return new Promise((resolve, reject) =>
            this.express.listen(port, (err) => {
                if (err) {
                    console.log(`Couldn't bind to port: ${port}. Reason: ${err}`);
                    reject(new Error(`Couldn't bind to port: ${port}. Reason: ${err}`));
                    return;
                }

                logger.debug(`Started listening on port ${port}`);
                resolve();
            }));
    }
}

export { App }
