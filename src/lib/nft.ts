import { Wallet } from '../wallets/wallet'
import { getCID, getMetaFromIpfs } from './ipfs'
import { Transaction } from 'algosdk'
import { get_asa_create_txn, get_asa_destroy_txn, sendWait, getSuggested } from './algorand'
import {platform_settings as ps } from './platform-conf'
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
        const create_txn = new Transaction(await get_asa_create_txn(suggested, creator, this.metaSrc()))
        create_txn.assetDecimals = 1 //TODO: take out
        const [s_create_txn] = await wallet.signTxn([create_txn])
        return await sendWait(s_create_txn)
    }

    async destroyToken(wallet: Wallet){
        const creator = wallet.getDefaultAccount()
        const suggested = await getSuggested(10)
        const destroy_txn = new Transaction(await get_asa_destroy_txn(suggested, creator, this.asset_id))
        const [s_destroy_txn] = await wallet.signTxn([destroy_txn])
        return await sendWait(s_destroy_txn)
    }


    imgSrc (): string {
        if (this.metadata.file_hash !== undefined && this.metadata.file_hash != "")
            return ps.ipfs.display + this.metadata.file_hash

        return "https://via.placeholder.com/500"
    }
    metaSrc(): string {
        return ps.ipfs.display + this.meta_cid.toString()
    }

    explorerSrc(): string {
        const net = ps.algod.network == "mainnet"?"":ps.algod.network + "."
        return "https://"+ net + ps.explorer + "/asset/" + this.asset_id
    }

    static async fromAsset(asset: any): Promise<NFT> {
        const url: string = asset['params']['url']
        const chunks: string[] = url.split("/")
        const mhash = chunks[chunks.length-1]

        const cid = getCID(mhash)

        // TODO: check this
        const md = await getMetaFromIpfs(cid);

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
    };
}