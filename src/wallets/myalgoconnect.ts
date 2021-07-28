import { TransactionParams, Transaction } from 'algosdk'
import {SignedTxn, Wallet} from './wallet'
import MyAlgo from '@randlabs/myalgo-connect';

//@ts-ignore
import logo_inverted from './branding/myalgo-connect/Logo-inverted.png'
//@ts-ignore
import logo from './branding/myalgo-connect/Logo.png'
import { showErrorToaster } from '../Toaster';


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

    img(inverted: boolean): string {
        return MyAlgoConnectWallet.img(inverted)
    }

    async connect(): Promise<boolean> {
        try {
            const accounts = await this.walletConn.connect();
            this.accounts = accounts.map((account) => account.address);
        }catch(err){
            showErrorToaster("Failed to connect to MyAlgoConnect")
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

    async signTxn(txns: Transaction[]): Promise<SignedTxn[]> {
        return await this.walletConn.signTransaction(txns.map(t=>{return t.bytesToSign()})) 
    }

    signBytes(b: Uint8Array): Promise<Uint8Array> {
        throw new Error('Method not implemented.')
    }

    async signTeal(teal: Uint8Array): Promise<Uint8Array> {
        return await this.walletConn.signLogicSig(teal, this.getDefaultAccount())
    }
}

export default MyAlgoConnectWallet