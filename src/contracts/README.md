## RareAF Contract Descriptions

Actions:

    - create: Creates listing, account that creates listing is the `creator`
    - tag: Xfers a tag token to a listing
    - untag: Xfers a tag token from a listing
    - increase_price:  Xfers price tokens to a listing
    - decrease_price: Xfers price tokens from a listing
    - delete: Destroys listing by sending Platform tokens (Price/Tags) back to platform owner and NFT/Algos back to creator
    - purchase: Xfers NFT to buyer, $fee Algos to platform with close to creator, and platform tokens back to platform owner 
    - safety: Same as delete but issued by the admin accouont in the case that there is a dangerous bug or some legal issue

Roles:

    - creator: The account that creates the listing
    - platform admin: The account responsible for creating/updating application and can pay fees for the platform owner
    - platform owner: The escrow account responsible for creating platform tokens and signing xfers to valid listing contracts 
    - buyer: The account that purchases a listing


*Listing*
-----------
Stateless Escrow account, approves Create/Delete/Purchase directly and offloads Tag/Untag/Increase Price/Decrease Price to be approved by a valid NoOp App Call.

Any account possessing >0 price tokens is treated as a listing


*Platform Approval*
--------------------
Stateful Contract that approves transactions and validates a listing contract is valid using some string manipulation to validate a preimage of the hash of the contract with the variables removed. 

Stores the listing in the address of the listing in a creators local state.


*Platform Clear*
-----------------
Does nothing

*Platform Owner*
----------------
Stateless escrow account responsible for validating that the first transaction in a group was either approved by the admin or the app.  Creates and holds the reserve for Platform tokens and xfers them to listing contracts validated by the app logic. 
