
import { TransactionParams } from 'algosdk'
import { SignedTxn, Wallet } from './wallet'
import algosdk from 'algosdk'

class InsecureWallet implements Wallet {
    accounts: string[]
    default_account: number
    network: string

    pkToSk: object

    async connect(settings: object): Promise<boolean> {
        this.accounts = []
        this.pkToSk  = {}
        for(const pk in settings){
            this.accounts.push(pk)
            this.default_account = 0;
            this.pkToSk[pk] = algosdk.mnemonicToSecretKey(settings[pk].join(" "))
        }

        return true
    }

    isConnected(): boolean {
        return this.accounts.length>0;
    }

    getDefaultAccount(): string {
        return this.accounts[0];
    }

    async sign(txn: TransactionParams): Promise<SignedTxn> {
        let addr = this.getDefaultAccount()
        return algosdk.signTransaction(txn, this.pkToSk[addr])
    }

    async signBytes(b: Uint8Array): Promise<Uint8Array> {
        let addr = this.getDefaultAccount()
        return algosdk.signBytes(b, this.pkToSk[addr])
    }

    signTeal(teal: Uint8Array): Promise<Uint8Array> {
        throw new Error('Method not implemented.')
    }
}

export default InsecureWallet;