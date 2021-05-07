import { Wallet } from '../wallets/wallet'
import { getMetaFromIpfs } from './ipfs'
import { get_asa_create_txn, get_asa_destroy_txn, sendWait } from './algorand'
import CID from 'cids'


interface NFTMetadata {
    file_name: string
    file_hash: string
    file_type: string
    file_size: number

    // Descriptive details
    title:      string 
    artist:     string
    description:string 
    tags:       string[]
}

export default class NFT {
    asset_id: number // ASA idx in algorand
    meta_cid:  CID// IPFS CID of metadata json

    metadata: NFTMetadata

    constructor(metadata: NFTMetadata, asset_id?: number) {
        this.metadata = metadata
        this.asset_id = asset_id
    }

    async createToken(wallet: Wallet){
        const creator = wallet.getDefaultAccount()
        const create_txn = await get_asa_create_txn(false, creator, this.getMetaDataHash())
        const s_create_txn = await wallet.sign(create_txn)
        return await sendWait(s_create_txn)
    }

    async destroyToken(wallet: Wallet){
        const creator = wallet.getDefaultAccount()
        const destroy_txn = await get_asa_destroy_txn(false, creator, this.asset_id)
        const s_destroy_txn = await wallet.sign(destroy_txn)
        return await sendWait(s_destroy_txn)
    }

    getMetaDataHash() { 
        return Array.from(this.meta_cid.cid.multihash.subarray(2))
    }

    imgSrc (): string {
        if (this.metadata.file_hash !== undefined)
            return 'http://ipfs.io/ipfs/'+this.metadata.file_hash

        return "https://via.placeholder.com/500"
    }

    static async fromMetaHash(meta_hash: string): Promise<NFT> {
        const [cid, md] = await getMetaFromIpfs(meta_hash);
        const nft = new NFT(md)
        nft.meta_cid = cid
        return nft
    }
}
