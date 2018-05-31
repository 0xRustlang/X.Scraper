import {IProxy} from "./IProxy";

interface IScrapper {
    scrape() :  Promise<Array<IProxy>>;
    getProviderUrl() : string;
}

export {IScrapper};