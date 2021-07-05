import {TagToken} from './tags'

type AlgodConf = {
    server: string
    port: number
    token: string
    network: string
};
type IpfsConf = {
    host: string
    display: string
};
type IndexerConf = {
    server: string
    port: number
    token: string
};
type AppConf = {
    app_id: number
    price_id: number
    owner_addr: string
    admin_addr: string
    fee_amt: number
    seed_amt: number
    name: string
    unit: string

    contracts: {
        approval: string
        clear: string
        listing: string
    }
    max_price: number

};

type DevConf = {
    debug_txns: boolean
};

type PlatformConf = {
    domain: string
    algod: AlgodConf,
    ipfs: IpfsConf,
    indexer: IndexerConf,
    explorer: string,
    application: AppConf,
    def: DevConf,
    tags: TagToken[]
};


const platform_settings = require("../../config.json") as PlatformConf;

export { platform_settings }