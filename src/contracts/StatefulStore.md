*Creator Storage:*
------------------
Max of 16 live listings
Cond to find first empty space and store 


Tagging:
--------

Tags should only be sent from Application
Listing Can only support max of 8 tags. 


*OPERATIONS:*
-------------

CREATE:
=======

    - Creator Call Application to store Addr of listing and requests N price tokens
         (Args with listing teal, price int, asa idx)
    - Creator Seed Listing with algos
    - Listing opt into PRICE TOKENS
    - Listing opt into NFT
    - Creator config NFT to Listing
    - Send NFT to Listing

TAG:
====

    - Opt into valid Tag token
    - Application send token to listing _iff_ listing has < 8

UNTAG:
======

    - Send Token with closeAssetTo back to platform
    - Opt out?

PRICE DECREASE 
==============

    - Listing price tokens back to platform

PRICE INCREASE
===============

    - Application price tokens to Listing

DELETE:
=======

    - Send NFT back to creator
    - Reconfigure NFT back to creator
    - Send Algos back to creator
    - Send price tokens with close to back to platform
    - Send all tag tokens back to platform


PURCHASE:
=========

    - Buyer Send Algos to Creator
    - Listing reconfigure NFT to Buyer
    - Listing send NFT to Buyer
    - Listing send Fee to platform with Close to Algos to creator
    - Listing send Price Tokens back to platform
    - Listing send Tags back to platform