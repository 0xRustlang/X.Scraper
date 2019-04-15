import * as express from 'express'
import { UAParser } from 'ua-parser-js'

export default function expressUserAgent(): any {
    return (request: express.Request, response: express.Response, next: any) => {
        request.userAgent = new UAParser(request.get('user-agent'));
        next();
    };
}
