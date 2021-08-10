

```

   _____                _____   ________) 
  (, /   )             (, /  | (, /       
    /__ / _  __  _       /---|   /___,    
 ) /   \_(_(/ (_(/_   ) /    |) /         
(_/                  (_/     (_/          
                                          

```

**Do not use**


**For real, don't**

Rare AF is _your_ NFT Marketplace

- Fork this repo and configure it
- Publish it on Cloudflare or Fleek
- Mint NFTs, Exhibit them, List them for sale, Host others
- Profit?


*huh?*

You own the platform, decide who has access and can customize its appearance. 

Rare AF showrooms let you display your digital assets.  Showrooms can be personal collections you want to exhibit. Or you can choose to list your assets for sale. You can also choose to host curated guest collections as an exhibibition or for sale. 


*how much tho?*

Fork it for free, configure it, publish it on a static hosting site. Then you set commision fees on the works that sell.

donate to this address (charity? Dao?)

```
#TODO:

   Initialization:
      - Config write to github? IPFS with link in global var on app?

   IPFS:
      - Pin files?

   General:
      - Convert numbers to bignum
      - Add descriptive messages for the txns being signed
      - Add more currencies for price tokens
      - Add other contract type hashes

   Minting:
      - Add more fields for metadata

   Browse:
      - Add filters on browse page for tags/price
      - Check filetype/dimensions for display

   Purchase
      - Remove tags prior during purchase txn 
   
```

## Developers
To get started:
- fork this repository
- `cp init.config.json config.json`
- set the fields market with YOUR XXX
- in the root dir run `npm run serve`
- connect a wallet
- navigate to the admin page
- click "create"
- copy the json generated in the `application` section over into your config, it will include owner addr, listing hash, price id and app id
- restart the npm server
- optionally create tags on the admin page by typing the tag name into the box and hitting enter (limited to 32 bytes - (short name of app + 1), dont use a colon), add the tag array created in the json to your config and restart the server
- Set up static hosting on cloudflare or github or fleek or ipfs for your fork
- Shill your market to artists
- profit?

#### WARNING #####
the contracts have _not_ been audited. you are responsible for reading and validating that there is nothing dangerous.

Happy to receive pull requests especially for the items in the todo list

