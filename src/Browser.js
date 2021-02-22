/* eslint-disable no-console */
'use strict'

const React = require('react')
import {Card} from '@blueprintjs/core'

class Browser extends React.Component {
  constructor(props) {
        super(props)

        this.state = {
            token_prefix: "RareAF",
            tokens:[],
            metas:[{title:"adsf", artist:"asdfadf", description:"dsaf adsf adsf afdasdfasd asdf adsfasdf asdf asdf"},{},{},{},{}]
        }
        this.getTokens = this.getTokens.bind(this)

        //this.getTokens()

    }

    async getTokens(){
        AlgoSigner.connect().then((d)=>{}).catch((e) => { console.error(e); });

        const assets = await AlgoSigner.indexer({
            ledger: 'TestNet',
            path: `/v2/assets?name=RareAF&limit=100`,
        });
        console.log(assets)
        this.setState({tokens:assets.assets})


        let notes = []
        for(let x = 0; x<assets.assets.length; x++){
            let a = assets.assets[x];
            const tx = await AlgoSigner.indexer({
                ledger: 'TestNet',
                path: `/v2/assets/${a.index}/transactions?max-round=${a['created-at-round']}`
            });
            notes.push(JSON.parse(atob(tx.transactions[0].note)))
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