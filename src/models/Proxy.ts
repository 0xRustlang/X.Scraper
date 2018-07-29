import {
    AllowNull,
    AutoIncrement,
    Column, CreatedAt,
    DataType,
    Default,
    DefaultScope,
    IsIP,
    Length,
    Model,
    PrimaryKey,
    Scopes, Sequelize,
    Table, UpdatedAt
} from "sequelize-typescript";

import { Moment } from "moment";
import * as _ from 'lodash';
import { IProxy, ProtocolEnum } from "../interfaces/IProxy";
import moment = require("moment");
import { momentToSQL, sqlToMoment } from "../utils";

function defaultMomentObject() : Moment {
    return moment().utc().subtract(process.env.CHECK_TIMEOUT, 'minutes')
}

@DefaultScope({
    attributes: ['server', 'port']
})
@Scopes({
    check: () => {
        return {
            where: {
                [Sequelize.Op.or]: {
                    lastChecked: {
                        [Sequelize.Op.lte]: momentToSQL(defaultMomentObject())
                    },
                    checked: false
                }
            }
        }
    },
    checked: {
        where: {
            checked: true
        }
    },
    protocol: (protocol : string | Array<string>) => {
        return {
            where: {
                protocol: protocol
            }
        };
    }
})
@Table({
    tableName: 'proxy',
    indexes: [
        {
            unique: true,
            fields: ['server', 'port']
        },
        {
            name: 'time_index',
            method: 'BTREE',
            fields: ['lastChecked']
        }
    ]
})
export class Proxy extends Model<Proxy> implements IProxy {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id : number;

    @IsIP
    @AllowNull(false)
    @Column(DataType.STRING(16))
    server : string;

    @AllowNull(false)
    @Column(DataType.STRING(5))
    port : string;

    @Length({ min: 2, max: 3 })
    @Column(DataType.STRING(3))
    isoCode : string;

    @Column(DataType.STRING(50))
    country : string;

    @Default(false)
    @Column
    checked : boolean;


    @Column(DataType.DATE)
    get lastChecked() : Moment {
        let dbDate = this.getDataValue('lastChecked');

        if (_.isNil(dbDate)) {
            return defaultMomentObject();
        }

        return sqlToMoment(this.getDataValue('lastChecked'));
    };

    set lastChecked(lastChecked : Moment) {
        this.setDataValue('lastChecked', momentToSQL(lastChecked));
    };

    @Column(DataType.STRING(6))
    protocol : ProtocolEnum;

    @Column(DataType.FLOAT)
    lossRatio : number;

    @Column(DataType.INTEGER)
    pingTimeMs : number;

    @CreatedAt
    @Column
    createdAt : Date;

    @UpdatedAt
    @Column
    updatedAt : Date;
}