import {ApplicationConfiguration} from './application-configuration'

type AlgodConf = {
    server: string
    port: number
    token: string
    network: string
};
type IpfsConf = {
    display: string
    token: string
};
type IndexerConf = {
    server: string
    port: number
    token: string
};

type Contracts = {
    approval: string
    clear: string
    listing: string
};

type DevConf = {
    debug_txns: boolean
    accounts: {
        [key: string]: string[]
    }
};

type PlatformConf = {
    domain: string
    algod: AlgodConf,
    ipfs: IpfsConf,
    indexer: IndexerConf,
    explorer: string,
    application: ApplicationConfiguration,
    contracts: Contracts
    dev: DevConf,
};

const platform_settings = require("../../config.json") as PlatformConf;

export { PlatformConf, platform_settings }