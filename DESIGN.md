# RareAF Design

This marketplace was designed in such a way that it can be hosted on any static hosting provider without a backend database besides the Algorand chain.

To make this possible and to make the listings filterable, we create tokens to represent the price of a listing (# tokens == price) and tokens to represent subject specific tags (`gif`, `image`, `generative-art`, ...). These platform tokens are held in reserve by a contract account referred to as "owner".

NFTs are represented by an ASA with its URL parameter referencing an IPFS hosted metadata file conforming to [arc3](https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0003.md). An NFT is minted by uploading an image file and setting detail fields and hitting the Mint button. The image and details are packaged into an IPFS directory and a transaction is created to generate the ASA pointing to the metadata file.

A Stateful Smart Contract (Application) is used to store the address of the listings an account owns in their `local state`. This app must be opt'ed into prior to a user creating a listing. We automatically check for this when a user tries to list

Listings are escrow accounts created from the `listing.tmpl.teal` teal program.  When a user decides to list an NFT, the template fields in the listing program are filled in with the appropriate parameters like ASA id and the Creator Address. An atomic group transaction is created to initialize the listing account by seeding it with algos to pay for fees, opting into the apppropriate assets, configuring the ASA to make the listing address the manager, and setting the listing address in the creators local state. 

The listing holds a number of Price Tokens equal to its price and whatever optional tag tokens are relevant. The price of a listing can be changed by changing the number of price tokens it holds. Tags can be added and removed at will. The listing can be delisted by either the owner or the Application creator.  Purchasing a listing involves sending the appropriate transactions that fulfil the logic in the listing teal contract and the ASA is xferred to the buyer with the configuration updated to make the buyer the manager.

For Contract specific documentation, please see the README in the src/contracts directory.