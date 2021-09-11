import { Wallet } from "algorand-session-wallet";
import algosdk, { Transaction } from "algosdk";
import { platform_settings as ps } from "./platform-conf";
import { addrToB64, getLogicFromTransaction, getSuggested, getToken, getTransaction, sendWait } from "./algorand";
import { ApplicationConfiguration, get_template_vars, ReloadApplicationConfiguration } from "./application-configuration";
import { get_platform_owner } from "./contracts";
import { get_cosign_txn, get_asa_create_txn, get_asa_destroy_txn } from "./transactions";


export type ASADetails = {
    id: number
    units: number
    decimals: number

    name: string
    unitName: string

    url: string

    icon: string
}

export class PriceToken {

    id: number;

    asa: ASADetails;

    constructor(ac: ApplicationConfiguration, name: string, id?: number) {
        this.asa = {id: PriceToken.getAssetId(name)} as ASADetails
        this.id = id ||= 0
    }

    async populateDetails(): Promise<PriceToken>{
        //Lookup
        if(this.asa.id === 0){
            //Algos
            this.asa.units = 1e17 
            this.asa.decimals = 6 
            this.asa.unitName = "μA" 
            this.asa.url = "algorand.com" 
            this.asa.name = "Algos" 

            return this
        }

        const details = await getToken(this.asa.id)
        
        this.asa.units = details.params.total
        this.asa.decimals = details.params.decimals
        this.asa.unitName = details.params['unit-name']
        this.asa.url = details.params.url
        this.asa.name = details.params.name

        return this
    }

    async create(conf: ApplicationConfiguration, wallet: Wallet): Promise<boolean> {

        const suggestedParams = await getSuggested(10)

        const cosign_txn = new Transaction(get_cosign_txn(suggestedParams, conf.admin_addr))

        const create_px = new Transaction(get_asa_create_txn(suggestedParams, conf.owner_addr, ps.domain))
        create_px.assetName     = PriceToken.getAssetName(conf.name, this.asa.id)
        create_px.assetUnitName = PriceToken.getUnitName(conf.unit)
        create_px.assetTotal    = 1e10
        create_px.assetDecimals = 0 
        
        const grouped = [cosign_txn, create_px]
        algosdk.assignGroupID(grouped)
        const [s_cosign_txn, /* create_px */] = await wallet.signTxn(grouped)

        const ls = await get_platform_owner(get_template_vars(conf, {
            "TMPL_ADMIN_ADDR":addrToB64(conf.admin_addr),
        }))

        const s_create_px = algosdk.signLogicSigTransaction(create_px, ls)

        await sendWait([s_cosign_txn, s_create_px])

        const result = await getTransaction(s_create_px.txID)

        if(result === undefined) return  false 

        this.id = result['asset-id']

        return true
    }

    async destroy(conf: ApplicationConfiguration, wallet: Wallet): Promise<boolean>{
        if(this.id == 0) return true

        const suggestedParams = await getSuggested(10)

        const cosign_txn = new Transaction(get_cosign_txn(suggestedParams, conf.admin_addr))

        const destroy_px = new Transaction(get_asa_destroy_txn(suggestedParams, conf.owner_addr, this.id))
        
        const grouped = [cosign_txn, destroy_px]

        algosdk.assignGroupID(grouped)
        const [s_cosign_txn, /* s_destroy_px */] = await wallet.signTxn(grouped)

        const ls = await getLogicFromTransaction(conf.owner_addr)

        const s_destroy_px = algosdk.signLogicSigTransaction(destroy_px, ls)

        return (await sendWait([s_cosign_txn, s_destroy_px])) !== undefined
    }

    static getAssetId(name: string): number {
        console.log(name)
        if(name.includes(":"))
            return parseInt(name.split(":")[1])

        return parseInt(name)
    }

    static getAssetName(name: string, asa_id: number): string {
        return name + ":" + asa_id
    }

    static getUnitName(unit: string): string {
        return unit + ":px"
     }

     static fromAsset(conf: ApplicationConfiguration, asset: any): PriceToken {
        const pt = new PriceToken(conf, PriceToken.getAssetName("", asset.index))

        pt.asa.units = asset.params.total
        pt.asa.decimals = asset.params.decimals
        pt.asa.unitName = asset.params['unit-name']
        pt.asa.url = asset.params.url
        pt.asa.name = asset.params.name

        return pt
     }
}
