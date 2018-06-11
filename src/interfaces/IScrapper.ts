import { IProxy } from "./IProxy";

interface IScrapper {
    scrape(pageLimit?: number) : Promise<Array<IProxy>>;
    getProviderUrl() : string;
}

export { IScrapper };