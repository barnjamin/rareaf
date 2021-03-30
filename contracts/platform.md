Platform Contract Pair
======================

In General, a pair of contracts is created where one implements the logic for the platform the other checks that it is valid before distibuting a token signifiying admission onto
the platform. 

- A token is created that will be distibuted to accounts, holding the tokens will be identifiable as members of the platform. The tokens are held in an account that permits
  a delegated signature to distribute the tokens.
- 2 stateless smart contracts are created
    1) Template Contract Signature - The variables in the contract will be set by the user of the platform (here as listing.teal)
    2) Delegated Signature - Distributes tokens only to contract accounts that have been created using the Template Contract Signature logic (here as platform.teal)
- The hash of a blank template is generated ahead of time and stored.  When an account wants to join the platform, the variables are filled in and the contract account is created.
- A Grouped transaction containing the contract signature and variables is validated against the delegated signature.  One tx in the grouped tx contains the blank template contract 
  which is compared to the prestored hash (validating behavior).  Additionally, the variables are populated with those passed by the user and compared with the reciever 
  of the tokens (validating receiver is the one implementing the behavior).
- Once validated, the tokens are distributed to the contract account and the account is considered as part of the platform. Accounts holding the tokens can be searched for
  using one of the services that index the blockchain.

In the case of this example, part of the required logic is that the tokens can only be sent back to the platform and the contract account only accepts 1 asset id. 
On close of contract (delisting or purchase here) the tokens are returned to the platform account. 

Questions
=========

- Is this dumb or a hack?
- Does this already have a name?
- How does this get broken?
