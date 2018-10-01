import { Moment } from "moment";

export interface IProxy {
    server : string;
    port : string;
    isoCode?: string;
    country?: string;
    checkedTimes: number;
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
