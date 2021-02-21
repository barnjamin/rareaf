/* eslint-disable no-console */
'use strict'

const React = require('react')
import { Button,Card, Divider, FormGroup, InputGroup, TextArea } from "@blueprintjs/core"


class AlgorandTokenizer extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            unitName: "RAF", // used to display asset units to user
            assetName: "RareAF", // "friendly name" of asset
            note: "NFT created at rare.af", // arbitrary data to be stored in the transaction, here, none is stored
        } 
        this.handleChange = this.handleChange.bind(this)
        this.createToken = this.createToken.bind(this)
    }


    async createToken(event) {
        event.stopPropagation()
        event.preventDefault()
        console.log(this.state)

        AlgoSigner.connect().then((d)=>{}).catch((e) => { console.error(e); });
        
        //TODO: select box to pick which acct to use
        let accts = await AlgoSigner.accounts({ ledger: 'TestNet' })
        const acct = accts[0]["address"]

        let txParams = await AlgoSigner.algod({ ledger: 'TestNet', path: '/v2/transactions/params' })

        let signedTx = await AlgoSigner.sign({
            from: acct,
            assetName: this.state.assetName,
            assetUnitName: this.state.unitName,
            assetTotal: 1,
            assetDecimals: 0,
            note: this.state.note,
            type: 'acfg',
            fee: txParams['min-fee'],
            firstRound: txParams['last-round'],
            lastRound: txParams['last-round'] + 1000,
            genesisID: txParams['genesis-id'],
            genesisHash: txParams['genesis-hash'],
            assetURL: "rare.af/xxxyyy"
        });

        let tx = await AlgoSigner.send({ ledger: 'TestNet', tx: signedTx.blob })

        // Check status
        AlgoSigner.algod({
            ledger: 'TestNet',
            path: '/v2/transactions/pending/' + tx.txId
        }).then((d) => {
            console.log(d);
        //{
        //    "asset-index": 14130107,
        //    "confirmed-round": 12466518,
        //    "pool-error": "",
        //    "sender-rewards": 200,
        //    "txn": {
        //      "sig": "AwlZmLVmIpT2VCX5O3KuA6DxGpeDO0mHEIlXQvcXgn7AXCzRhHGea+Rl5YRKv86mbDaUuxwCR3Q5+vWznnHxBQ==",
        //      "txn": {
        //        "apar": {
        //          "an": "asdf",
        //          "t": 1,
        //          "un": "asdf"
        //        },
        //        "fee": 241000,
        //        "fv": 12466462,
        //        "gen": "testnet-v1.0",
        //        "gh": "SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI=",
        //        "lv": 12467462,
        //        "note": "YXNkZmFzZGY=",
        //        "snd": "FIDEILRA72RRJM2SLT6NMIJK7NCFXLBCZWDCZPHIMO5S3X7QKGKXKJ4ASY",
        //        "type": "acfg"
        //      }
        //    }
        //  }

        }).catch((e) => {
            console.error(e);
        });
    }

    handleChange(event){
        const target = event.target
        const value = target.type == 'checkbox' ? target.checked : target.value
        const name = target.name
        this.setState({ [name]: value })
    }

    render() {

        if(typeof AlgoSigner === 'undefined'){
            return ( <p>Please Download AlgoSigner to create a token</p>)
        }                

        return (                    
            <div className='container'>
                <div className='token-mint container'>
                    <input className='token-details token-name bp3-input bp3-large' name='assetName' id='assetName' value={this.state.assetName} onChange={this.handleChange}></input>
                    <input className='token-details token-unit-name bp3-input bp3-large ' name='unitName' id='unitName' value={this.state.unitName} onChange={this.handleChange}></input>
                </div>
                <textarea className='token-details token-note bp3-input bp3-large ' name='note' id='note' value={this.state.note} onChange={this.handleChange}/>
            </div>
        )

    }

}
module.exports = AlgorandTokenizer