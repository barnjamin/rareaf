import { Wallet } from "algorand-session-wallet";
import algosdk, { Transaction } from "algosdk";
import { platform_settings as ps } from "./platform-conf";
import { getSuggested, getToken, sendWait } from "./algorand";
import { ApplicationConfiguration } from "./application-configuration";
import { get_app_call_txn } from "./transactions";
import { AdminMethod } from "./application";


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
            this.asa.unitName = "A" 
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
        const suggestedParams = await getSuggested(100)

        const create_px = new Transaction(get_app_call_txn(suggestedParams, conf.id, conf.admin_addr, [AdminMethod.CreatePrice]))
        create_px.appForeignAssets = [this.asa.id]
        
        const [s_create_px, /* create_px */] = await wallet.signTxn([create_px])

        const result = await sendWait([s_create_px])

        if(result === undefined) return  false 

        this.id = result['asset-id']

        return true
    }

    async destroy(conf: ApplicationConfiguration, wallet: Wallet): Promise<boolean>{
        if(this.id == 0) return true

        const suggestedParams = await getSuggested(100)

        const destroy_px = new Transaction(get_app_call_txn(suggestedParams, conf.id, conf.admin_addr, [AdminMethod.DestroyPrice]))
        destroy_px.appForeignAssets = [this.id]
        
        const [s_destroy_px, /* s_destroy_px */] = await wallet.signTxn([destroy_px])

        return (await sendWait([s_destroy_px])) !== undefined
    }


    static format(pt: PriceToken, val: number): string {
        console.log(val, pt.asa.decimals)
        return (val / Math.pow(10, pt.asa.decimals)).toString()
    }

    static toDisplay(pt: PriceToken, val: string): string {
        if(val.includes(".")){
            const chunks = val.split(".")
            if(chunks.length>1 && chunks[1].length>pt.asa.decimals){
                val = chunks[0] + "." + chunks[1].slice(0, pt.asa.decimals)
            }
        }
        return val
    }

    static toUnits(pt: PriceToken, val: number): number {
        return val * Math.pow(10, pt.asa.decimals)
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
