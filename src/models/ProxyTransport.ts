import {Column, DataType, ForeignKey, Model, PrimaryKey, Table} from "sequelize-typescript";
import {IProxyTransport} from "../interfaces/IProxyTransport";
import {Proxy} from "./Proxy";

@Table
export class ProxyTransport extends Model<ProxyTransport> implements IProxyTransport {
    @PrimaryKey
    @Column(DataType.STRING(6))
    protocol: string;

    @Column(DataType.FLOAT)
    lossRatio: number;

    @Column(DataType.INTEGER)
    pingTimeMs: number;

    @ForeignKey(() => Proxy)
    @PrimaryKey
    @Column
    proxyServer: string;
}