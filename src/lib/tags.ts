import {Wallet} from '../wallets/wallet'
import {Transaction } from 'algosdk'
import { getSuggested, get_asa_create_txn, get_asa_destroy_txn, sendWait } from './algorand';
import { platform_settings as ps } from './platform-conf';

export class TagToken {

    id: number;
    name: string;
    constructor(name: string, id?: number) {

        //Check if its prefixed unit and remove it
        if(name.substr(0,3) == ps.application.unit)  name = name.substr(4)

        this.name = name
        this.id = id ||= 0
    }

    async delete(wallet: Wallet): Promise<boolean> {
        const suggestedParams = await getSuggested(10)
        const destroy_txn = new Transaction(get_asa_destroy_txn(suggestedParams, wallet.getDefaultAccount(), this.id))
        const [signed] = await wallet.signTxn([destroy_txn])
        const result = await sendWait(signed)

        if (result['pool-error'] !== "") {
            alert("Error: "+result['pool-error'])
            return false
        }

        return true
    }

    async create(wallet: Wallet): Promise<number> {
        const suggestedParams = await getSuggested(10)
        const create_txn = new Transaction(get_asa_create_txn(suggestedParams, wallet.getDefaultAccount(), this.getUrl()))
        create_txn.assetName = this.getTokenName() 
        create_txn.assetUnitName = TagToken.getUnitName()

        create_txn.assetTotal = 1e6
        create_txn.assetDecimals = 1 // TODO:: take out

        const [ signed ] = await wallet.signTxn([create_txn])

        const result = await sendWait(signed)

        if (result['pool-error'] !== "") {
            alert("Error: "+result['pool-error'])
        }

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
