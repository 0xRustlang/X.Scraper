import {IProxyRatio} from "./IProxyRatio";
import {Moment} from "moment";

interface IProxy {
    server: string;
    port: string;
    isoCode?: string;
    checked: boolean;
    lastChecked: Moment | Date;
    ratios?: Array<IProxyRatio>;
}

export {IProxy};