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
            this.state.listings.map((m,i) => {     
                /// Return the element. Also pass key     
                console.log(m)
                const idx = m.token.index
                return (
                    <Card className='content-card' key={idx} >
                        <div className='container'>
                            <a href={'/listing/'+m.address}>
                                <img src={m.meta.img_src}></img>
                            </a>
                        </div>
                        <div className='container'>
                            <p>
                                <a href={'/listing/'+m.address}> 
                                    <b>{m.meta.title}</b> - <i>{m.meta.artist}</i> (${m.details[0]})
                                </a>

                            </p>
                        </div>
                        <div className='container'>
                            <p>{m.meta.description}</p>
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