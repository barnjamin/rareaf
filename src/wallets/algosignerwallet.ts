
import algosdk, { Transaction, TransactionParams } from 'algosdk'
import { SignedTxn, Wallet } from './wallet'


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

    async signTxn(txns: Transaction[]): Promise<SignedTxn[]> {

        const encoded_txns = txns.map((tx: Transaction) => {
            const t = {txn: AlgoSigner.encoding.msgpackToBase64(tx.toByte())};
            if(tx.from !== algosdk.decodeAddress(this.getDefaultAccount())){
                t.signers = []
            }
            return t
        });

        const signed = await AlgoSigner.signTxn(encoded_txns);
        return signed.map((signedTx)=>{
            return {
                txID: signedTx.txID,
                blob: AlgoSigner.encoding.base64ToMsgpack(signedTx.blob),
            }
        })
    }

    async sign(txn: TransactionParams): Promise<SignedTxn> {

        //const t = {...txn};
        //if('name' in t) delete t['name'];
        //if('tag' in txn) delete t['tag'];

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