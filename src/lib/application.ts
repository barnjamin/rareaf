import { get_approval_program, get_clear_program, get_listing_hash } from "./contracts"

const dummy_addr = "b64(YWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWE=)"
const dummy_id = "b64(AAAAAAAAAHs=)"

export enum Method {
    Create = "Y3JlYXRl",
    Delete = "ZGVsZXRl",
    Tag = "dGFn",
    Untag = "dW50YWc=",
    PriceIncrease = "cHJpY2VfaW5jcmVhc2U=",
    PriceDecrease = "cHJpY2VfZGVjcmVhc2U=",
    Purchase = "cHVyY2hhc2U=",
}

export class Application {

    conf: {
        owner: string // Address of applictation owner
        name: string  // Full name of 
        unit: string  // Unit name for price/tag tokens
        fee: number   // Amount to be sent to app onwer on sales

        id?: number          // ID of application 
        priceToken?: number  // ID of token representing price 
        listingHash?: string // Sha256 of blanked out listing contract  
    }

    constructor(settings: any){
        this.conf = settings
    }

    async create(): Promise<boolean> {
        // Create price token with app name 
        await this.createPriceToken() 
        // Create blank app to reserve ID
        await this.updateApplication()

        // Populate Contracts with ids to get the blank hash 
        const lc = await get_listing_hash({
            "TMPL_PRICE_ID": this.conf.priceToken, 
            "TMPL_APP_ID":this.conf.id,
            "TMPL_CREATOR_ADDR": dummy_addr, // Dummy addr
            "TMPL_ASSET_ID": dummy_id //Dummy int
        }) 

        this.conf.listingHash = lc.toString('base64')

        // Update Application with hash of contract && price token id
        this.updateApplication()

        // Sign delegate to xfer tokens
        this.signDelegate()

        return false
    }


    async signDelegate(): Promise<Buffer> {
        return undefined
    }

    async updateApplication() {
        const app = await get_approval_program({
            "TMPL_PRICE_ID":this.conf.priceToken, 
            "TMPL_BLANK_HASH": this.conf.listingHash ||= dummy_addr
        }) 
        const clear = await get_clear_program({})

        if (this.conf.id == 0){
            //Its a create
            this.conf.id = 0 
        }else{
            
            // Its an update
        }
    }

    async createPriceToken()  {
        this.conf.priceToken = 0
    } 

    async createTagToken(name: string) { }
}