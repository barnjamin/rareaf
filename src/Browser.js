/* eslint-disable no-console */
'use strict'

const React = require('react')

class Browser extends React.Component {
  constructor(props) {
        super(props)

        this.state = {
            token_prefix: "RareAF",
            tokens:[]
        }
        this.getTokens = this.getTokens.bind(this)

        this.getTokens()

    }

    async getTokens(){
        AlgoSigner.connect().then((d)=>{}).catch((e) => { console.error(e); });

        const assets = await AlgoSigner.indexer({
            ledger: 'TestNet',
            path: `/v2/assets?name=RareAF&limit=100`,
        });

        this.setState({tokens:assets.assets})
    }



    render() {
        return (
        <div className='container' >
            <ul>
            { this.state.tokens.map((asset) => {     
                // Return the element. Also pass key     
                return (<li >{asset.index}</li> ) 
            })}
            </ul>
        </div>
        )

    }
}
module.exports = Browser