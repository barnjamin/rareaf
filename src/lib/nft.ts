import { Wallet } from '../wallets/wallet'
import { getMetaFromIpfs, getCIDFromMetadataHash } from './ipfs'
import { get_asa_create_txn, get_asa_destroy_txn, sendWait, getSuggested } from './algorand'
import CID from 'cids'

export class NFT {
    asset_id: number // ASA idx in algorand
    manager: string // Current manager of the token representing this NFT
    meta_cid:  CID// IPFS CID of metadata json

    metadata: NFTMetadata

    constructor(metadata: NFTMetadata, asset_id?: number, manager?: string) {
        this.metadata = metadata
        this.asset_id = asset_id
        this.manager = manager
    }

    async createToken(wallet: Wallet){
        const creator = wallet.getDefaultAccount()
        const suggested = await getSuggested(10)
        const create_txn = await get_asa_create_txn(suggested, creator, this.getMetaDataHash())
        const s_create_txn = await wallet.sign(create_txn)
        return await sendWait(s_create_txn)
    }

    async destroyToken(wallet: Wallet){
        const creator = wallet.getDefaultAccount()
        const suggested = await getSuggested(10)
        const destroy_txn = await get_asa_destroy_txn(suggested, creator, this.asset_id)
        const s_destroy_txn = await wallet.sign(destroy_txn)
        return await sendWait(s_destroy_txn)
    }

    getMetaDataHash() { 
        return Array.from(this.meta_cid.cid.multihash.subarray(2))
    }

    imgSrc (): string {
        if (this.metadata.file_hash !== undefined && this.metadata.file_hash != "")
            return 'http://ipfs.io/ipfs/'+this.metadata.file_hash

        return "https://via.placeholder.com/500"
    }

    static async fromAsset(asset: any): Promise<NFT> {
        const meta_hash = asset['params']['metadata-hash']
        const cid = await getCIDFromMetadataHash(meta_hash)
        const md = await getMetaFromIpfs(cid.multihash);

        const nft = new NFT(md, asset['index'], asset['params']['manager'])

        nft.meta_cid = cid

        return nft
    }

    static emptyNFT(): NFT {
        return new NFT(emptyMetadata())
    }
}


export type NFTMetadata = {
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

export function emptyMetadata(): NFTMetadata {
    return {
            file_name: "" , 
            file_hash: "", 
            file_type: "",
            file_size: 0, 
            title:     "" , 
            artist:    "", 
            description: "", 
            tags:      [] ,
    };
}