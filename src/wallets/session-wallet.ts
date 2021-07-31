import AlgoSignerWallet from './algosignerwallet'
import MyAlgoConnectWallet from './myalgoconnect'
import InsecureWallet from './insecurewallet'
import {Wallet} from './wallet'
import { platform_settings as ps } from '../lib/platform-conf'
import algosdk from 'algosdk'

export const allowedWallets =  { 
        'algo-signer':      AlgoSignerWallet, 
        'my-algo-connect':  MyAlgoConnectWallet, 
        'insecure-wallet':  InsecureWallet,
        'dev-wallet':       InsecureWallet
}

const wallet_preference_key = 'wallet-preference'
const acct_list_key = 'acct-list'
const acct_preference_key = 'acct-preference'
const mnemonic_key = 'mnemonic'

export class SessionWallet {
        wallet: Wallet 
        wname: string

        constructor(wname?: string)  {
                if (wname) this.setWalletPreference(wname)

                this.wname = this.walletPreference()

                if (!(this.wname in allowedWallets)) return 

                this.wallet = new allowedWallets[this.wname](ps.algod.network)
                this.wallet.accounts = this.accountList() 
                this.wallet.default_account = this.accountIndex()
        }

        async connect(): Promise<boolean> {
                if(this.wallet === undefined) return false

                switch(this.wname){
                case 'insecure-wallet':
                    const stored_mnemonic = this.mnemonic()

                    const mnemonic = stored_mnemonic?stored_mnemonic:prompt("Paste your mnemonic space delimited (DO NOT USE WITH MAINNET ACCOUNTS)")
                    this.setMnemonic(mnemonic)
                    const sk = algosdk.mnemonicToSecretKey(mnemonic)

                    if (await this.wallet.connect({[sk.addr]:mnemonic.split(" ")})) {
                        this.setAccountList(this.wallet.accounts)
                        this.wallet.default_account = this.accountIndex()
                        return true
                    } 

                    break
                case 'dev-wallet':
                    if (await this.wallet.connect(ps.dev.accounts)){
                       this.setAccountList(this.wallet.accounts)
                       this.wallet.default_account = this.accountIndex()
                       return true
                    }  

                    break
                default:
                    if (await this.wallet.connect()){
                       this.setAccountList(this.wallet.accounts)
                       this.wallet.default_account = this.accountIndex()
                       return true
                    } 
                    break
                }

                // Fail
                this.wipe()
                return false
        }

        setAccountList(accts: string[]) { sessionStorage.setItem(acct_list_key, JSON.stringify(accts)) }
        accountList() : string[] { const accts = sessionStorage.getItem(acct_list_key); return accts=="" ? [] : JSON.parse(accts) }

        setAccountIndex(idx: number) { this.wallet.default_account = idx; sessionStorage.setItem(acct_preference_key, idx.toString()) }
        accountIndex(): number { const idx = sessionStorage.getItem(acct_preference_key); return idx == ""?0:parseInt(idx) }

        setWalletPreference(wname: string) { this.wname = wname; sessionStorage.setItem(wallet_preference_key, wname) }
        walletPreference(): string{ return sessionStorage.getItem(wallet_preference_key) }

        setMnemonic(m: string) { sessionStorage.setItem(mnemonic_key, m) }
        mnemonic(): string { return  sessionStorage.getItem(mnemonic_key) }

        wipe () {
                sessionStorage.setItem(wallet_preference_key, '')
                sessionStorage.setItem(acct_preference_key, '')
                sessionStorage.setItem(acct_list_key, '')
                sessionStorage.setItem(mnemonic_key, '')
                this.wallet = undefined
                this.wname = undefined
        }
}

