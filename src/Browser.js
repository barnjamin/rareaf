/* eslint-disable no-console */
'use strict'

const React = require('react')
import {Card} from '@blueprintjs/core'
//import {listTokens, getTokenMetadata} from './AlgorandTokenizer'



async function listTokens(){
    const assets = await AlgoSigner.indexer({
        ledger: 'TestNet',
        path: `/v2/assets?name=RareAF&limit=100`,
    });
    console.log(assets.assets)

    return assets.assets
}

async function getTokenMetadata(token_id, created_at) {
    const tx = await AlgoSigner.indexer({
        ledger: 'TestNet',
        path: `/v2/assets/${token_id}/transactions?max-round=${created_at}`
    });

    let created_tx = tx.transactions[0]
    // Just return the first one
    let meta = {}
    try {
        meta = JSON.parse(atob(created_tx.note))
    }catch (err){
        console.error(err)
    }
    return meta
}


class Browser extends React.Component {
  constructor(props) {
        super(props)

        this.state = {
            token_prefix: "RareAF",
            tokens:[],
            metas:[{title:"adsf", artist:"asdfadf", description:"dsaf adsf adsf afdasdfasd asdf adsfasdf asdf asdf"},{},{},{},{}]
        }
        this.getTokens = this.getTokens.bind(this)

        this.getTokens()


        AlgoSigner.algod({
            ledger:'TestNet',
            path:'/v2/'
        })



    }

    async getTokens(){
        let tokens = await listTokens()
        console.log(tokens)
        let notes = []
        for (const idx in tokens){
            let token = tokens[idx]
            console.log(token)
            let meta = await getTokenMetadata(token['index'], token['created-at-round'])
            notes.push(meta)
        }
        this.setState({metas:notes})
    }


    render() {
        return (
        <div className='container' >
            
            { this.state.metas.map((m,i) => {     
                // Return the element. Also pass key     
                console.log(m)
                return (
                    <Card className='content-card' key={i} >
                        <div className='container'>
                            <a href={'/raf/'+i}>
                                <img src='http://via.placeholder.com/550'></img>
                            </a>
                        </div>
                        <div className='container'>
                            <p><a href={'/raf/'+i}> <b>{m.title}</b> - <i>{m.artist}</i></a></p>
                        </div>
                        <div className='container'>
                            <p>{m.description}</p>
                        </div>
                    </Card> 
                ) 
                    //    <img src={'http://ipfs.io/ipfs/'+m.file_hash} />
            })}
        </div>
        )

    }
}
module.exports = Browser