import { TransactionParams } from 'algosdk'
import {SignedTxn, Wallet} from './wallet'
import MyAlgo from '@randlabs/myalgo-connect';

import logo_inverted from 'url:./branding/myalgo-connect/Logo-inverted.png'
import  logo from 'url:./branding/myalgo-connect/Logo.png'


class MyAlgoConnectWallet implements Wallet {
    accounts: Array<string>
    default_account: number
    network: string

    walletConn: MyAlgo 

    constructor(network: string) {
        this.network = network
        this.accounts = []
        this.default_account = 0

        this.walletConn = new MyAlgo()
    }

    static img(inverted: boolean): string {
        return inverted?  logo_inverted : logo 
    }

    async connect(): Promise<boolean> {
        try {
            const accounts = await this.walletConn.connect();
            this.accounts = accounts.map((account) => account.address);
        }catch(err){
            alert("Failed to do the thing")
            return false
        }

        return true;
    }

    isConnected(): boolean {
        return this.accounts.length>0;
    }

    getDefaultAccount(): string {
        return this.accounts[this.default_account];
    }

    async sign(txn: TransactionParams): Promise<SignedTxn> {
        return await this.walletConn.signTransaction(txn);
    }
    async signTxn(txns: SignedTxn[]): Promise<SignedTxn[]> {
        return undefined
    }

    signBytes(b: Uint8Array): Promise<Uint8Array> {
        throw new Error('Method not implemented.')
    }

    async signTeal(teal: Uint8Array): Promise<Uint8Array> {
        return await this.walletConn.signLogicSig(teal, this.getDefaultAccount())
    }
}

export default MyAlgoConnectWallet