
import { TransactionParams } from 'algosdk'
import { SignedTxn, Wallet } from './wallet'


class AlgoSignerWallet implements Wallet {
    accounts: Array<string> 
    default_account: number
    network: string

    constructor(network: string) { 
        this.network = network 
        this.accounts = []
        this.default_account = 0
    }

    async connect(): Promise<boolean> {
        if (typeof AlgoSigner === 'undefined')
            alert('Make Sure AlgoSigner wallet is installed and connected');

        try {
            await AlgoSigner.connect()
        } catch (err) { 
            console.error("Failed to connect: ", err) 
            alert("Couldn't connect to algosigner, is it installed?")
        }

        const accts = await AlgoSigner.accounts({ ledger: this.network })
        this.accounts = accts.map((a)=>{ return a.address})

        return true
    }

    isConnected(): boolean {
        if (typeof AlgoSigner === 'undefined') return false;
        return this.accounts.length>0
    }

    getDefaultAccount(): string {
        return this.accounts[this.default_account];
    }

    async sign(txn: TransactionParams): Promise<SignedTxn> {
        const stxn = await AlgoSigner.sign(txn)
        const blob = new Uint8Array(Buffer.from(stxn.blob, 'base64'))
        return {txID: stxn.txID, blob: blob}
    }

    async signBytes(b: Uint8Array): Promise<Uint8Array> {
        throw new Error('Method not implemented.')
    }

    async signTeal(teal: Uint8Array): Promise<Uint8Array> {
        throw new Error('Method not implemented.')
    }
}

export default AlgoSignerWallet;