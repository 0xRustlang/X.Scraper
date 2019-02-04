import { IProxy } from "./IProxy";

export interface IScrapper {
    scrape(pageLimit?: number): Promise<Array<IProxy>>;
    getProviderUrl(): string;
}
