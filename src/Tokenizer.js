/* eslint-disable no-console */
'use strict'

const React = require('react')
const algorand = require('algosdk')

class Tokenizer extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            addr: "BH55E5RMBD4GYWXGX5W5PJ5JAHPGM5OXKDQH5DC4O2MGI7NW4H6VOE4CP4", // the account issuing the transaction, the asset creator
            reserve: addr, // specified address is considered the asset reserve (it has no special privileges, this is only informational)
            freeze: addr, // specified address can freeze or unfreeze user asset holdings
            clawback: addr, // specified address can revoke user asset holdings and send them to other addresses
            manager: addr, // specified address can change reserve, freeze, clawback, and manager
            fee: 10, // the number of microAlgos per byte to pay as a transaction fee
            defaultFrozen: false, // whether user accounts will need to be unfrozen before transacting
            genesisHash: "SGO1GKSzyE7IEPItTxCByw9x8FmnrCDexi9/cOUJOiI:", // hash of the genesis block of the network to be used
            totalIssuance: 1, // total number of this asset in circulation
            decimals: 0, // hint that the units of this asset are whole-integer amounts
            unitName: "RAF", // used to display asset units to user
            assetName: "RareAF", // "friendly name" of asset
            genesisID: "", // like genesisHash this is used to specify network to be used
            firstRound: 322575, // first Algorand round on which this transaction is valid
            lastRound: 322575, // last Algorand round on which this transaction is valid
            note: undefined, // arbitrary data to be stored in the transaction, here, none is stored
            assetURL: "http://rare.af/xxxyyy", // optional string pointing to a URL relating to the asset 
            assetMetadataHash: "", // optional hash commitment of some sort relating to the asset. 32 character length.
        }

    }


    createToken() {
        // signing and sending "txn" allows "addr" to create an asset
        let txn = algosdk.makeAssetCreateTxn(addr, fee, firstRound, lastRound, note,
            genesisHash, genesisID, totalIssuance, decimals, defaultFrozen, manager, reserve, freeze, clawback,
            unitName, assetName, assetURL, assetMetadataHash);

    }


    render() {
        return (


        )

    }

}
module.exports = Tokenizer