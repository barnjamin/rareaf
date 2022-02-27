import { addrToB64, getGlobalState, getPriceTokens, getTags, uintToB64 } from './algorand'
import {TagToken} from './tags'
import {PriceToken} from './price'
import { platform_settings as ps } from './platform-conf'
import algosdk from 'algosdk'
import { collapseTextChangeRangesAcrossMultipleVersions } from 'typescript'

const conf_session_key = "config"

export class ApplicationConfiguration  {

    constructor(
        public id: number               = 0,
        public app_addr: string         = "",  // Address of application 
        public admin_addr: string       = "",  // Creator of the application
        public name: string             = "",  // Full name of App 
        public unit: string             = "",  // Unit name for price/tag tokens
        public price_ids: PriceToken[]  = [],   // ID of price token
        public fee_amt: number          = 0,   // Amount to be sent to app onwer on sales
        public seed_amt: number         = 0,   // Amount sent to each listing to cover costs
        public max_price: number        = 0,   // The max number of price tokens that can be distributed to a listing
        public listing_hash: Uint8Array = new Uint8Array(),  // The hash of the blanked out listing template contract
        public tags: TagToken[]         = [],  // Subject specific tags
        public state_fields: string[]   = [],  // List of fields that are stored in app config
        public loaded: boolean          = false // local tracker for if we need to load the config
    ){ }

    static async fromNetwork(ac: ApplicationConfiguration): Promise<ApplicationConfiguration> {
        if(ac.id==0){ return {...ac, loaded:true} }

        // get global state of application
        const state = await getGlobalState(ac.id)

        console.log(state)

        //Set fields
        const new_ac = {...new ApplicationConfiguration(), ...ac, loaded: true}

        for(let idx=0; idx<state.length; idx++){
            const key = Buffer.from(state[idx].key, 'base64').toString()
            let value_bytes = Buffer.from(state[idx].value.bytes, 'base64')

            if(typeof new_ac[key] ==='number') {
                console.log(key, value_bytes)
                new_ac[key] = algosdk.decodeUint64(new Uint8Array(value_bytes), 'safe')
            } else if(typeof new_ac[key]  === 'string' && key.endsWith("addr")) {
                new_ac[key] = algosdk.encodeAddress(value_bytes)
            }else {
                new_ac[key] = value_bytes.toString()
            }
        }

        new_ac.tags = await getTags(new_ac, new_ac.app_addr, new_ac.unit)
        new_ac.price_ids = await getPriceTokens(new_ac)

        ApplicationConfiguration.updateLocalStorage(new_ac)

        return new_ac 
    }

    static async fromLocalStorage(ac: ApplicationConfiguration): Promise<ApplicationConfiguration> {
        if(ac.id==0){ return {...ac, loaded: true} }

        const conf = sessionStorage.getItem(conf_session_key)
        if(conf) return JSON.parse(conf)

        return undefined;
    }

    static async updateLocalStorage(ac: ApplicationConfiguration): Promise<Boolean> {
        console.log(ac)
        sessionStorage.setItem(conf_session_key, JSON.stringify(ac))
        return true
    }

}


export async function ReloadApplicationConfiguration(): Promise<ApplicationConfiguration> {
    sessionStorage.removeItem(conf_session_key)
    return await LoadApplicationConfiguration()
}

export async function LoadApplicationConfiguration(): Promise<ApplicationConfiguration> {
    const ac = await ApplicationConfiguration.fromLocalStorage(ps.application)
    if(ac!==undefined){
        return ac
    }

    return await ApplicationConfiguration.fromNetwork(ps.application)
}

export function get_template_vars(ac: ApplicationConfiguration, override: any): any {
    return {
        "TMPL_APP_ID": ac.id,
        "TMPL_APP_ADDR": addrToB64(ac.app_addr),
        "TMPL_ADMIN_ADDR": addrToB64(ac.admin_addr),
        "TMPL_FEE_AMT": ac.fee_amt,
        "TMPL_PRICE_ID": ac.price_ids && ac.price_ids.length>0?ac.price_ids[0].id:0,
        "TMPL_BLANK_HASH": ac.listing_hash,
        "TMPL_SEED_AMT": ac.seed_amt,
        ...override
    }
}

export function makeArgs(ac: ApplicationConfiguration): string[] {
    const args = []
    for(const fidx in ac.state_fields){
        const field = ac.state_fields[fidx]
        const val = ac[field]
        if(typeof val === 'number'){
            args.push(uintToB64(val))
        } else if(typeof val === 'string' && field.endsWith("addr")) {
            args.push(Buffer.from(algosdk.decodeAddress(val).publicKey).toString('base64'))
        } else if(typeof val === 'string' || field === 'listing_hash') {
            args.push(Buffer.from(val).toString('base64'))
        } else {
            console.log("No conf entry for: ", field, typeof val)
        }
    }

    return args
}
