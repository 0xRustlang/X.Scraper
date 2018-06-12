import { IProxy } from "../../interfaces/IProxy";
import { IProxyTransport } from "../../interfaces/IProxyTransport";

class ClientProxyModel {
    public ip : string;
    public port : number;
    public loss_ratio : number;
    public country : string;
    public ping_time_ms : number;
    public protocol : string;
    public iso_code : string;

    public constructor(proxy : IProxy, transport : IProxyTransport) {
        this.ip = proxy.server;
        this.port = parseInt(proxy.port);
        this.loss_ratio = transport.lossRatio;
        this.ping_time_ms = transport.pingTimeMs;
        this.protocol = transport.protocol;
        this.country = proxy.country;
        this.iso_code = proxy.isoCode;
    }
}

export { ClientProxyModel };