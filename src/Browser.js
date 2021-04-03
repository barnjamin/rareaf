/* eslint-disable no-console */
'use strict'

const React = require('react')
import { Card} from '@blueprintjs/core'
import { getListings, getTokenMetadataFromTransaction } from './lib/algorand'
import { getMetaFromIpfs, getCIDFromMetadataHash } from './lib/ipfs'

class Browser extends React.Component {
  constructor(props) {
        super(props)

        this.state = {
            token_prefix: "RareAF",
            tokens:[],
            metas:[]
        }

        this.getTokens = this.getTokens.bind(this)

        this.getTokens()
    }

    async getTokens(){
        let tokens = await getListings()
        this.setState({tokens:tokens})
        let notes = []
        console.log(tokens)
        for (const idx in tokens){
            let token = tokens[idx]
            let meta = {}

            if(token['index'] == 14216913)  continue;

            if(token['params']['metadata-hash'] !== undefined) {
                const cid = getCIDFromMetadataHash(token['params']['metadata-hash'])
                meta = await getMetaFromIpfs(cid.toString())
            }else{
                meta = await getTokenMetadataFromTransaction(token['index'])
            }

            notes.push(meta)
        }
        console.log(notes)
        this.setState({metas:notes})
    }


    render() {
        return (
        <div className='container' >
            { this.state.metas.map((m,i) => {     
                // Return the element. Also pass key     
                const idx = this.state.tokens[i]['index']
                return (
                    <Card className='content-card' key={idx} >
                        <div className='container'>
                            <a href={'/raf/'+idx}>
                                <img src={'http://ipfs.io/ipfs/'+m.file_hash}></img>
                            </a>
                        </div>
                        <div className='container'>
                            <p><a href={'/raf/'+idx}> <b>{m.title}</b> - <i>{m.artist}</i></a></p>
                        </div>
                        <div className='container'>
                            <p>{m.description}</p>
                        </div>
                    </Card> 
                ) 
            })}
        </div>
        )

    }
}
module.exports = Browser