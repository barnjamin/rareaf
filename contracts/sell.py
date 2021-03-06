from pyteal import *

# Creates a contract to be used as a Delegate signature

# Contract validates tx is grouped tx including: 
#   transfer of asset_id X to buyer
#   transfer of X algos to seller 

def sell(tmpl_fee=1000, tmpl_asset_id=0, tmpl_seller="", tmpl_cost=100):
    #Check if this is a Asset Transfer funding tx

    isSafe = And(
        Global.group_size() == Int(2),
        #Tx 1
        Gtxn[0].fee() < Int(tmpl_fee),
        Gtxn[0].close_remainder_to() == Global.zero_address(),
        Gtxn[0].rekey_to() == Global.zero_address(),
        #Tx 2
        Gtxn[1].fee() < Int(tmpl_fee),
        Gtxn[1].close_remainder_to() == Global.zero_address(),
        Gtxn[1].rekey_to() == Global.zero_address(),
    )

    assetTxValid = And(
       Gtxn[0].type_enum() == TxnType.AssetTransfer,
       Gtxn[0].config_asset() == Int(tmpl_asset_id),
       Gtxn[0].asset_amount() == Int(1),
       Gtxn[0].sender() == Addr(tmpl_seller)
    )

    algoTxValid = And(
       Gtxn[1].type_enum() == TxnType.Payment,
       Gtxn[1].amount() == Int(tmpl_cost),
       Gtxn[1].receiver() == Addr(tmpl_seller)
    )

    return And(isSafe, assetTxValid, algoTxValid)

print(compileTeal(sell(tmpl_asset_id=3, tmpl_seller="LWFFE2TME372URXA4J6T4IK5V72HPLRXHLZQNF2WIV4FWE5H2ZDW5K7GOI"), Mode.Signature))