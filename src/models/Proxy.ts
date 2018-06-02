import {
    AllowNull,
    BeforeBulkCreate,
    BeforeBulkUpdate,
    BeforeCreate,
    BeforeUpdate,
    Column,
    DataType,
    Default,
    DefaultScope,
    HasMany,
    IsIP,
    Length,
    Max,
    Min,
    Model,
    PrimaryKey,
    Scopes, Sequelize,
    Table
} from "sequelize-typescript";
import {ProxyTransport} from "./ProxyTransport";
import {Moment} from "moment";
import * as _ from 'lodash';
import {IProxy} from "../interfaces/IProxy";
import moment = require("moment");
import {momentToSQL, sqlToMoment} from "../utils";

function defaultMomentObject(): Moment {
    return moment().utc().subtract(process.env.CHECK_TIMEOUT, 'minutes')
}

@DefaultScope({
    attributes: ['server', 'port']
})
@Scopes({
    full: {
        attributes: ['isoCode', 'port', 'server', 'checked', 'lastChecked'],
        include: [() => ProxyTransport]
    },
    check: {
        attributes: ['port', 'server', 'checked', 'lastChecked'],
        where: {
            [Sequelize.Op.or]: {
                lastChecked: {
                    [Sequelize.Op.lte]: momentToSQL(defaultMomentObject())
                },
                checked: false
            }
        }
    }
})
@Table
export class Proxy extends Model<Proxy> implements IProxy {
    @IsIP
    @PrimaryKey
    @AllowNull(false)
    @Column(DataType.STRING(16))
    server: string;

    @AllowNull(false)
    @Column(DataType.STRING(5))
    port: string;

    @Length({min: 2, max: 3})
    @Column(DataType.STRING(3))
    isoCode: string;

    @Default(false)
    @Column
    checked: boolean;


    @Column(DataType.DATE)
    get lastChecked(): Moment {
        let dbDate = this.getDataValue('lastChecked');

        if (_.isNil(dbDate)) {
            return defaultMomentObject();
        }

        return sqlToMoment(this.getDataValue('lastChecked'));
    };

    set lastChecked(lastChecked: Moment) {
        this.setDataValue('lastChecked', momentToSQL(lastChecked));
    };

    @HasMany(() => ProxyTransport)
    proxyTransports: ProxyTransport[];
}