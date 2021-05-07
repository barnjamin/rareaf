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
            listings:[],
        }

        this.getListings = this.getListings.bind(this)
    }

    async componentDidMount(){
        this.getListings()
    }

    async getListings(){
        let listings = await getListings()
        this.setState({listings:listings})
    }


    render() {
        return (
        <div className='container' >
            { 
            this.state.listings.map((l) => {     
                console.log(l)
                return (
                    <Card className='content-card' key={l.asset_id} >
                        <div className='container'>
                            <a href={'/listing/'+l.contract_addr}>
                                <img src={l.nft.imgSrc()}></img>
                            </a>
                        </div>
                        <div className='container'>
                            <p>
                                <a href={'/listing/'+l.contract_addr}> 
                                    <b>{l.nft.metadata.title}</b> - <i>{l.nft.metadata.artist}</i> (${l.price})
                                </a>

                            </p>
                        </div>
                        <div className='container'>
                            <p>{l.nft.description}</p>
                        </div>
                    </Card> 
                ) 
            })
            }
        </div>
        )

    }
}
module.exports = Browser