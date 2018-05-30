import {IProxy} from "../interfaces/IProxy";

class BaseScrapper {
    protected constructor() {}

    public static scrape() :  Promise<Array<IProxy>> {
        throw new Error('Unimplemented');
    }
}

export {BaseScrapper};