const { Octokit } = require("@octokit/core");
const {
  createOAuthUserClientAuth,
} = require("@octokit/auth-oauth-user-client");


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
    id: number
    price_token: number
    owner: string
    name: string
    unit: string
    contracts: {
        approval: string
        clear: string
        listing: string
    }
    fee: number
    seed: number
    max_price: number

};
type DevConf = {
    debug_txns: boolean
}

type PlatformConf = {
    domain: string
    algod: AlgodConf,
    ipfs: IpfsConf,
    indexer: IndexerConf,
    explorer: string,
    application: AppConf,
    def: DevConf

};


const platform_settings = require("../../config.json") as PlatformConf;


export { platform_settings }
