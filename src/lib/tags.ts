import {Wallet} from '../wallets/wallet'
import algosdk, { Transaction } from 'algosdk'
import { 
    getSuggested, 
    get_cosign_txn,
    get_asa_create_txn, 
    get_asa_destroy_txn, 
    sendWait 
} from './algorand';
import { platform_settings as ps, get_template_vars } from './platform-conf';
import { get_platform_owner } from './contracts';
import { DESKTOP } from '@blueprintjs/icons/lib/esm/generated/iconContents';

export class TagToken {

    id: number;
    name: string;
    constructor(name: string, id?: number) {

        //Check if its prefixed unit and remove it
        if(name.substr(0,3) == ps.application.unit)  name = name.substr(4)

        this.name = name
        this.id = id ||= 0
    }

    static fromAsset(asset: any): TagToken {
        return  new TagToken(asset.params.name, asset.index)  
    }

    async delete(wallet: Wallet): Promise<boolean> {
        const suggestedParams = await getSuggested(10)

        const cosign_txn = new Transaction(get_cosign_txn(suggestedParams, ps.application.admin_addr))
        const destroy_txn = new Transaction(get_asa_destroy_txn(suggestedParams, ps.application.owner_addr, this.id))

        const grouped = [cosign_txn, destroy_txn]
        algosdk.assignGroupID(grouped)

        const [s_cosigned_txn, /* s_destroy_txn */] = await wallet.signTxn(grouped)

        const lsig = await get_platform_owner(get_template_vars({}))
        const s_destroy_txn = algosdk.signLogicSigTransaction(destroy_txn, lsig)

        const result = await sendWait([s_cosigned_txn, s_destroy_txn])

        return true
    }

    async create(wallet: Wallet): Promise<number> {
        const suggestedParams = await getSuggested(10)

        const cosign_txn = new Transaction(get_cosign_txn(suggestedParams, ps.application.admin_addr))

        const create_txn = new Transaction(get_asa_create_txn(suggestedParams, ps.application.owner_addr, this.getUrl()))
        create_txn.assetName = this.getTokenName() 
        create_txn.assetUnitName = TagToken.getUnitName()
        create_txn.assetTotal = 1e6
        create_txn.assetDecimals = 1 // TODO:: take out

        const grouped = [cosign_txn, create_txn]

        algosdk.assignGroupID(grouped)

        const [s_cosign_txn, /* create_txn */] = await wallet.signTxn(grouped)

        const lsig = await get_platform_owner(get_template_vars({}))

        const s_create_txn = algosdk.signLogicSigTransaction(create_txn, lsig)

        const result = await sendWait([s_cosign_txn, s_create_txn])
        console.log(result)

        this.id = result['asset-index']

        return this.id
    }

    getTokenName(): string {
        return ps.application.unit + ":" + this.name
    }

    static getUnitName(): string {
       return ps.application.unit + ":tag"
    }

    getUrl(): string {
        return ps.domain + "/tags/"+this.name
    }
}
