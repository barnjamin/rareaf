import { addrToB64, getGlobalState, getTags, uintToB64 } from './algorand'
import {TagToken} from './tags'
import { platform_settings as ps } from './platform-conf'
import algosdk from 'algosdk'

const conf_session_key = "config"

export class ApplicationConfiguration  {

    constructor(
        public id: number               = 0,
        public admin_addr: string       = "",  // Creator of the application
        public name: string             = "",  // Full name of App 
        public unit: string             = "",  // Unit name for price/tag tokens
        public price_id: number         = 0,   // ID of price token
        public owner_addr: string       = "",  // Address of price/tag token owner
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

        //Set fields
        const new_ac = {...new ApplicationConfiguration(), ...ac, loaded: true}

        for(let idx=0; idx<state.length; idx++){
            const key = Buffer.from(state[idx].key, 'base64').toString()
            let value_bytes = Buffer.from(state[idx].value.bytes, 'base64')

            if(typeof new_ac[key] ==='number') {
                new_ac[key] = algosdk.decodeUint64(new Uint8Array(value_bytes), 'safe')
            }else {
                new_ac[key] = value_bytes.toString()
            }
        }

        new_ac.tags = await getTags(new_ac, new_ac.owner_addr, new_ac.unit)

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
        "TMPL_ADMIN_ADDR": addrToB64(ac.admin_addr),
        "TMPL_OWNER_ADDR": addrToB64(ac.owner_addr),
        "TMPL_FEE_AMT": ac.fee_amt,
        "TMPL_PRICE_ID": ac.price_id?ac.price_id:0,
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
        } else if(typeof val === 'string' || field === 'listing_hash') {
            args.push(Buffer.from(val).toString('base64'))
        } else {
            console.log("No conf entry for: ", field, typeof val)
        }
    }

    return args
}

