interface IProxyTransport {
    pingTimeMs : number;
    lossRatio : number;
    protocol : string;
}

export { IProxyTransport }