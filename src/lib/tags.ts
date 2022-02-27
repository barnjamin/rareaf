import { Wallet } from 'algorand-session-wallet'
import algosdk, { Transaction } from 'algosdk'
import { 
    getLogicFromTransaction,
    getSuggested, 
    uintToB64,
    sendWait 
} from './algorand';
import {
    get_cosign_txn,
    get_asa_create_txn, 
    get_asa_destroy_txn,
    get_app_call_txn, 
} from './transactions'
import { platform_settings as ps } from './platform-conf';
import { ApplicationConfiguration, get_template_vars, LoadApplicationConfiguration } from './application-configuration';
import { AdminMethod } from './application';

export class TagToken {

    id: number;
    name: string;
    constructor(ac: ApplicationConfiguration, name: string, id?: number) {
        //Check if its prefixed unit and remove it
        if(name.slice(0,3) == ac.unit)  name = name.slice(4)

        this.name = name
        this.id = id ||= 0
    }

    static fromAsset(ac: ApplicationConfiguration, asset: any): TagToken {
        return new TagToken(ac, asset.params.name, asset.index)  
    }

    async destroy(wallet: Wallet): Promise<boolean> {
        const ac = await LoadApplicationConfiguration()

        const suggestedParams = await getSuggested(100)
        const destroy_txn = new Transaction(get_app_call_txn(suggestedParams, ac.id, ac.admin_addr, [AdminMethod.DestroyTag, uintToB64(this.id)]))
        const [s_destroy_txn] = await wallet.signTxn([destroy_txn])

        await sendWait([s_destroy_txn])

        return true
    }

    async create(wallet: Wallet): Promise<number> {

        const ac = await LoadApplicationConfiguration()

        const suggestedParams = await getSuggested(100)
        const create_txn = new Transaction(get_app_call_txn(suggestedParams, ac.id, ac.admin_addr, [AdminMethod.CreateTag, this.name]))
        const [s_create_txn] = await wallet.signTxn([create_txn])

        const result = await sendWait([s_create_txn])
        this.id = result['asset-index']

        return this.id
    }

    getTokenName(unit: string): string {
        return unit + ":" + this.name
    }

    static getUnitName(unit: string): string {
       return unit + ":tag"
    }

    getUrl(): string {
        return ps.domain + "/tags/"+this.name
    }
}
