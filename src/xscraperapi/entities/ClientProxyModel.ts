import { IProxy, ProtocolEnum } from "../../interfaces/IProxy";

class ClientProxyModel {
    public server : string;
    public port : number;
    public loss_ratio : number;
    public country : string;
    public ping_time_ms : number;
    public protocol : ProtocolEnum;
    public iso_code : string;

    public constructor(proxy : IProxy) {
        this.server = proxy.server;
        this.port = parseInt(proxy.port);
        this.loss_ratio = proxy.lossRatio;
        this.ping_time_ms = proxy.pingTimeMs;
        this.protocol = proxy.protocol;
        this.country = proxy.country;
        this.iso_code = proxy.isoCode;
    }
}

export { ClientProxyModel };