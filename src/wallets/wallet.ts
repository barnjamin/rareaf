import {Transaction} from 'algosdk';

export interface SignedTxn {
    txn: string;
    blob: string;
}

export interface Wallet {
    accounts: Array<string>;
    default_account: number;
    network: string;

    connect(): Promise<boolean>;
    isConnected(): boolean;

    getDefaultAccount(): string;

    sign(txn: Transaction): Promise<SignedTxn>;
    signBytes(b: Uint8Array): Promise<Uint8Array>;
    signTeal(teal: Uint8Array): Promise<Uint8Array>;
}
