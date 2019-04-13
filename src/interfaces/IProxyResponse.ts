export interface IProxyResponse {
    server: string;
    port: number;
    iso_code: string;
    country: string;
    protocol: string;
    ping_time_ms: number;
    loss_ratio: number;
    username?: string;
    password?: string;
}
