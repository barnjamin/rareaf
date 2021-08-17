import { TagToken } from './tags'
import { addrToB64 } from './algorand'

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
type AppConf = {
    app_id: number      // ID of application
    price_id: number    // ID of price token
    owner_addr: string  // Address of price/tag token owner
    admin_addr: string  // Address of app creator 
    fee_amt: number     // Amount to be sent to app onwer on sales
    seed_amt: number    // Amount sent to each listing to cover costs
    name: string        // Full name of App 
    unit: string        // Unit name for price/tag tokens
    tags: TagToken[]    // Subject specific tags
    max_price: number   
    listing_hash: string
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
    application: AppConf,
    contracts: Contracts
    dev: DevConf,
};

const platform_settings = require("../../config.json") as PlatformConf;

function get_template_vars(override: any): any {
    return {
        "TMPL_APP_ID": platform_settings.application.app_id,
        "TMPL_ADMIN_ADDR": addrToB64(platform_settings.application.admin_addr),
        "TMPL_OWNER_ADDR": addrToB64(platform_settings.application.owner_addr),
        "TMPL_FEE_AMT": platform_settings.application.fee_amt,
        "TMPL_PRICE_ID": platform_settings.application.price_id,
        "TMPL_BLANK_HASH": platform_settings.application.listing_hash,
        ...override
    }
}



export { platform_settings, AppConf, get_template_vars }