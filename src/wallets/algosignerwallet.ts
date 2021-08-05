
import algosdk, { Transaction, TransactionParams } from 'algosdk'
import { SignedTxn, Wallet } from './wallet'

//@ts-ignore
import logo_inverted from './branding/algosigner/Logo-inverted.png'
//@ts-ignore
import logo from './branding/algosigner/Logo.png'


declare const AlgoSigner: any;

class AlgoSignerWallet implements Wallet {
    accounts: Array<string> 
    default_account: number
    network: string

    constructor(network: string) { 
        this.network = network 
        this.accounts = []
        this.default_account = 0
    }

    static img(inverted: boolean): string {
        return inverted?logo_inverted:logo
    }
    img(inverted: boolean): string {
        return AlgoSignerWallet.img(inverted)
    }

    async connect(): Promise<boolean> {

        if(this.isConnected()) return true;

        const loaded = await this.waitForLoaded() 

        if(!loaded){
            alert("AlgoSigner not loaded, is it installed?")
            return
        }

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

    async waitForLoaded(): Promise<boolean> {
        for(let x=0; x<3; x++){
            if (typeof AlgoSigner !== 'undefined'){ return true }
            await new Promise(r=>{setTimeout(r, 1000)})
        }

        return false
    }


    isConnected(): boolean {
        if (typeof AlgoSigner === 'undefined') return false;
        return this.accounts && this.accounts.length>0
    }

    getDefaultAccount(): string {
        if(!this.isConnected()) return ""

        return this.accounts[this.default_account];
    }

    async signTxn(txns: Transaction[]): Promise<SignedTxn[]> {

        const default_acct = this.getDefaultAccount()

        const encoded_txns = txns.map((tx: Transaction) => {
            const t = {txn: AlgoSigner.encoding.msgpackToBase64(tx.toByte())};
            //@ts-ignore
            if(algosdk.encodeAddress(tx.from.publicKey) !== default_acct) t.signers = []
            return t
        });

        const signed = await AlgoSigner.signTxn(encoded_txns);

        return signed.map((signedTx)=>{
            if (signedTx) return {
                txID: signedTx.txID,
                blob: AlgoSigner.encoding.base64ToMsgpack(signedTx.blob),
            }
            return {}
        })
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