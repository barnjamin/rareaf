#!/bin/bash

python sell.py > sell.teal

./sandbox goal clerk compile sell.teal -o sell.lsig -s -a LWFFE2TME372URXA4J6T4IK5V72HPLRXHLZQNF2WIV4FWE5H2ZDW5K7GOI 

# Post sell.lsig somewhere?? with metadata to build tx?

# `{
# 	seller:"",
# 	asset_id:0,
# 	amount:0,
# 	lsig:[],
# }`
