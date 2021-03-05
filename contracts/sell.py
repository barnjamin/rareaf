from pyteal import *

# Creates a contract to be used as a contract acct
# Contract validates tx is either funding transaction or purchase transaction
#   On Funding, validate asset id and amount
#   On Purchase, validate payment to seller, asset to buyer 

def sell(tmpl_fee=1000, tmpl_asset_id=0, tmpl_seller="", tmpl_cost=0):
    #Check if this is a Asset Transfer funding tx
    isValidFunding = And(
        Global.group_size() == Int(1),
        Txn.fee() < Int(tmpl_fee),
        Txn.type_enum() == TxnType.AssetTransfer,
        Txn.close_remainder_to() == Global.zero_address(),
        Txn.rekey_to() == Global.zero_address(),
        Txn.config_asset() == Int(tmpl_asset_id),
        Txn.asset_amount() == Int(1),
        Txn.sender() == Addr(tmpl_seller)
    )

    # Purchase should be atomic tx of payment and Asset Transfer
    isValidPurchase = And(
        Global.group_size() == Int(2),
        # First one is a payment for the correct amount
        Gtxn[0].fee() < Int(tmpl_fee),
        Gtxn[0].type_enum() == TxnType.Payment,
        Gtxn[0].close_remainder_to() == Global.zero_address(),
        Gtxn[0].rekey_to() == Global.zero_address(),
        Gtxn[0].amount() == Int(tmpl_cost),
        Gtxn[0].receiver() == Addr(tmpl_seller),
        # Second one is an Asset Transfer
        Gtxn[1].fee() < Int(tmpl_fee),
        Gtxn[1].type_enum() == TxnType.AssetTransfer,
        Gtxn[1].close_remainder_to() == Global.zero_address(),
        Gtxn[1].rekey_to() == Global.zero_address(),
        Gtxn[1].config_asset() == Int(tmpl_asset_id),
        Gtxn[1].asset_amount() == Int(1),
        Gtxn[1].receiver() == Txn.sender()
    )

    isCancelSale = And(
        Global.group_size() == Int(1),
        Txn.fee() < Int(tmpl_fee),
        Txn.type_enum() == TxnType.AssetTransfer,
        Txn.close_remainder_to() == Global.zero_address(),
        Txn.rekey_to() == Global.zero_address(),
        Txn.config_asset() == Int(tmpl_asset_id),
        Txn.asset_amount() == Int(1),
    )

    return Or(isValidFunding, isValidPurchase, isCancelSale)

print(compileTeal(sell(tmpl_asset_id=3, tmpl_seller="LWFFE2TME372URXA4J6T4IK5V72HPLRXHLZQNF2WIV4FWE5H2ZDW5K7GOI"), Mode.Signature))