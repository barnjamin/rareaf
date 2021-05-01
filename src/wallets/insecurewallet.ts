
import { TransactionParams } from 'algosdk'
import { SignedTxn, Wallet } from './wallet'


class InsecureWallet implements Wallet {
    accounts: string[]
    default_account: number
    network: string

    connect(): Promise<boolean> {
        //TODO: read in file containing wallet with pk => mneumonic
        throw new Error('Method not implemented.')
    }
    isConnected(): boolean {
        throw new Error('Method not implemented.')
    }
    getDefaultAccount(): string {
        throw new Error('Method not implemented.')
    }
    sign(txn: TransactionParams): Promise<SignedTxn> {
        throw new Error('Method not implemented.')
    }
    signBytes(b: Uint8Array): Promise<Uint8Array> {
        throw new Error('Method not implemented.')
    }
    signTeal(teal: Uint8Array): Promise<Uint8Array> {
        throw new Error('Method not implemented.')
    }

}