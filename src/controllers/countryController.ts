import { Get, Route, Query, Controller } from 'tsoa';
import { Proxy } from "../models/Proxy";
import { Sequelize } from "sequelize-typescript";
import * as _ from "lodash";

@Route('country')
export class CountryController extends Controller {
    @Get('/')
    public async getCountry(@Query() reliable: number = 2): Promise<CountryResponse[]> {
        try {
            let countries = await Proxy
                .scope({
                    method: ['checkedTimes', reliable]
                })
                .findAll({
                    attributes: [
                        'country',
                        'isoCode'
                    ],
                    where: {
                        isoCode: {
                            [Sequelize.Op.not]: ""
                        }
                    },
                    group: ['country', 'isoCode']
                });

            return _.map(countries, proxy => ({ name: proxy.country, iso_code: proxy.isoCode }));
        } catch (e) {
            return [];
        }
    }
}

export interface CountryResponse {
    name: string;
    iso_code: string;
}
