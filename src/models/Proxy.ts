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
import * as moment from 'moment';
import { momentToSQL, sqlToMoment } from "../utils";

const enoughChecks = process.env.PREMIUM_CHECKS || 500;

function defaultMomentObject(): Moment {
    return moment().utc().subtract(process.env.CHECK_TIMEOUT, 'minutes')
}

@DefaultScope({
    attributes: ['server', 'port']
})
@Scopes({
    checkDead() {
        return {
            where: {
                lossRatio: {
                    [Sequelize.Op.eq]: 1
                }
            },
            order: [
                ['lastChecked', 'ASC'],
            ]
        }
    },
    check() {
        return {
            where: {
                [Sequelize.Op.or]: {
                    lastChecked: {
                        [Sequelize.Op.lte]: momentToSQL(defaultMomentObject())
                    },
                    checkedTimes: 0
                },
                [Sequelize.Op.and]: Sequelize.literal(`"lossRatio" IS DISTINCT FROM 1`)
            },
            order: [
                ['lastChecked', 'ASC'],
            ]
        }
    },
    eligibleToClean: {
        where: {
            lossRatio: 1,
            checkedTimes: {
                [Sequelize.Op.gt]: enoughChecks
            }
        }
    },
    premium() {
        return {
            where: {
                lossRatio: {
                    [Sequelize.Op.ne]: 1
                },
                checkedTimes: {
                    [Sequelize.Op.gt]: enoughChecks
                },
                [Sequelize.Op.and]: Sequelize.literal(`cast("passedTimes" as decimal) / "checkedTimes" >= 0.9`)
            }
        }
    },
    free() {
        return {
            where: {
                lossRatio: {
                    [Sequelize.Op.ne]: 1
                },
                [Sequelize.Op.or]: {
                    passedTimes: {
                        [Sequelize.Op.and]: {
                            [Sequelize.Op.lt]: enoughChecks,
                            [Sequelize.Op.gte]: 2
                        }
                    },
                    [Sequelize.Op.and]: Sequelize.literal(`cast("passedTimes" as decimal) / "checkedTimes" < 0.9`)
                }
            }
        }
    },
    uptime: (uptime: Number, op: string = '>=') => {
        return {
            where: { [Sequelize.Op.and]: Sequelize.literal(`cast("passedTimes" as decimal) / "checkedTimes" ${op} ${uptime}`) }
        }
    },
    checkedTimes: (times: Number) => {
        return {
            where: {
                checkedTimes: {
                    [Sequelize.Op.gte]: times
                }
            }
        }
    },
    protocol: (protocol: string | Array<string>) => {
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
        },
        {
            name: 'uptime_index',
            method: 'BTREE',
            fields: ['checkedTimes', 'passedTimes', 'pingTimeMs']
        }
    ]
})
export class Proxy extends Model<Proxy> implements IProxy {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id: number;

    @IsIP
    @AllowNull(false)
    @Column(DataType.STRING(16))
    server: string;

    @AllowNull(false)
    @Column(DataType.STRING(5))
    port: string;

    @Length({
        min: 2,
        max: 3
    })
    @Column(DataType.STRING(3))
    isoCode: string;

    @Column(DataType.STRING(50))
    country: string;

    @Default(0)
    @Column
    checkedTimes: number;

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

    @Column(DataType.STRING(6))
    protocol: ProtocolEnum;

    @Column(DataType.FLOAT)
    lossRatio: number;

    @Column(DataType.INTEGER)
    pingTimeMs: number;

    @CreatedAt
    @Column
    createdAt: Date;

    @UpdatedAt
    @Column
    updatedAt: Date;

    @Column(DataType.INTEGER)
    passedTimes: number;
}
