import { IProxyTransport } from "./IProxyTransport";
import { Moment } from "moment";

interface IProxy {
    server : string;
    port : string;
    isoCode?: string;
    country?: string;
    checked : boolean;
    lastChecked : Moment | Date;
    proxyTransports?: Array<IProxyTransport>;
}

export { IProxy };