import { Moment } from "moment";

interface IProxy {
    server : string;
    port : string;
    isoCode?: string;
    country?: string;
    checked : boolean;
    pingTimeMs?: number;
    lossRatio?: number;
    protocol?: ProtocolEnum;
    lastChecked : Moment | Date;
}

export enum ProtocolEnum {
    HTTPS = <any>'HTTPS',
    HTTP = <any>'HTTP',
    SOCKS5 = <any>'SOCKS5'
}


export { IProxy };