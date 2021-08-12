import { addrToB64, getGlobalState, uintToB64 } from './algorand'
import {TagToken} from './tags'

export class ApplicationConfiguration  {

    constructor(
        public id: number           = 0,
        public admin_addr: string   = "",  // Creator of the application
        public name: string         = "",  // Full name of App 
        public unit: string         = "",  // Unit name for price/tag tokens
        public price_id: number     = 0,   // ID of price token
        public owner_addr: string   = "",  // Address of price/tag token owner
        public fee_amt: number      = 0,   // Amount to be sent to app onwer on sales
        public seed_amt: number     = 0,   // Amount sent to each listing to cover costs
        public max_price: number    = 0,   // The max number of price tokens that can be distributed to a listing
        public listing_hash: string = "",  // The hash of the blanked out listing template contract
        public tags: TagToken[]     = [],  // Subject specific tags
        public fields: string[]     = []
    ){ }

    static async fromNetwork(app_id: number): Promise<ApplicationConfiguration> {
        if(app_id==0){ return new ApplicationConfiguration() }

        // get global state of application
        const result = await getGlobalState(app_id)

        //Parse result fields into appropriate fields
        console.log(result)

        return undefined;
    }

    static async fromLocalStorage(): Promise<ApplicationConfiguration> {
        return undefined;
    }



}
export function get_template_vars(ac: ApplicationConfiguration, override: any): any {
    return {
        "TMPL_APP_ID": ac.id,
        "TMPL_ADMIN_ADDR": addrToB64(ac.admin_addr),
        "TMPL_OWNER_ADDR": addrToB64(ac.owner_addr),
        "TMPL_FEE_AMT": ac.fee_amt,
        "TMPL_PRICE_ID": ac.price_id,
        "TMPL_BLANK_HASH": ac.listing_hash,
        "TMPL_SEED_AMT": ac.seed_amt,
        ...override
    }
}

export function makeArgs(ac: ApplicationConfiguration): string[] {
    const args = []
    for(const fidx in ac.fields){
        const field = ac.fields[fidx]
        const val = ac[field]
        if(typeof val == 'number'){
            args.push(uintToB64(val))
        }else if(field.slice(-4)=='addr') {
            args.push(addrToB64(val))
        }else{
             args.push(Buffer.from(val).toString('base64'))
        }
    }

    return args
}

