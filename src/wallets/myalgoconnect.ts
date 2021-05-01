import { Transaction } from 'algosdk'
import {Wallet} from './wallet'


class MyAlgoConnectWallet implements Wallet {
    network: string
    connect(): Promise<boolean> {
        throw new Error('Method not implemented.')
    }
    isConnected(): boolean {
        throw new Error('Method not implemented.')
    }
    sign(txn: Transaction): Promise<Uint8Array> {
        throw new Error('Method not implemented.')
    }
    signBytes(b: Uint8Array): Promise<Uint8Array> {
        throw new Error('Method not implemented.')
    }
    signTeal(teal: Uint8Array): Promise<Uint8Array> {
        throw new Error('Method not implemented.')
    }
    accounts: Array<string>
    default_account: number
}

export default MyAlgoConnectWallet