import register from 'ignore-styles'
register(['.scss', '.teal'])

import { expect } from 'chai';
import {getListing} from '../src/lib/algorand'
import 'mocha';

describe('Is This a test?',
  ()=>{
    it('should be a nft?', async ()=>{
      const addr = "3ESDM4QRMD4DJ43NURUBLWRSUBY4RYL6WPEPU77QFJSYX6KKCBVZFR6ZCM"
      const listing = await getListing(addr)
      expect(listing.price).to.equal(100000 )
    })
  }
)
