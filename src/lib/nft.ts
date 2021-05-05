import { Wallet } from '../wallets/wallet'
import { get_asa_create_txn, get_asa_destroy_txn, sendWait } from './algorand'

export default class NFT {
    asset_id: number

    file_hash: string // IPFS CID of file
    meta_hash: string // IPFS CID of metadata json

    // File details
    type: string  // MIME type
    size: number  // Number of bytes

    // Descriptive details
    title:      string 
    artist:     string
    description:string 

    tags:       string[]

    constructor(metadata: NFT, asset_id?: number) {
        this.title       = metadata.title        
        this.artist      = metadata.artist
        this.description = metadata.description
        this.file_hash   = metadata.file_hash
        this.asset_id    = asset_id
    }

    async createToken(wallet: Wallet){
        const creator = wallet.getDefaultAccount()
        const create_txn = await get_asa_create_txn(false, creator, this.getMeta())
        const s_create_txn = await wallet.sign(create_txn)
        await sendWait(s_create_txn)
    }

    async destroyToken(wallet: Wallet){
        const creator = wallet.getDefaultAccount()
        const destroy_txn = await get_asa_destroy_txn(false, creator, this.asset_id)
        const s_destroy_txn = await wallet.sign(destroy_txn)
        await sendWait(s_destroy_txn)
    }


    getMeta() { return Array.from(this.meta_hash.substring(2)) }
    imgSrc (): string {
        if (this.file_hash !== undefined)
            return 'http://ipfs.io/ipfs/'+this.file_hash

        return "https://via.placeholder.com/500"
    }
}