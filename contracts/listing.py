from pyteal import *

#RaF
platform_token = Int(1)
platform_account = Addr("UYNGBE3ZS4FVDAXPYPWJ7GQDEAELALTOS6RZTXWZ3PKVME5ZPBVQYS3NHA") 
platform_fee = Int(100)

def listing(price=Int(0), asset_id=Int(0), creator=Global.zero_address()):

    opt_in_asa = And(
       Txn.type_enum() == TxnType.AssetTransfer,
       Txn.asset_close_to() == Global.zero_address(),
       Txn.rekey_to() == Global.zero_address(),
       Txn.xfer_asset() == asset_id,
       Txn.asset_amount() == Int(0),
    )

    opt_in_platform = And(
       Txn.type_enum() == TxnType.AssetTransfer,
       Txn.asset_close_to() == Global.zero_address(),
       Txn.rekey_to() == Global.zero_address(),
       Txn.xfer_asset() == platform_token,
       Txn.asset_amount() == Int(0),
    )

    opt_in = Or(opt_in_asa, opt_in_platform)


    # Send Platform tokens back to platform account
    delist_platform = And(
        # Is safe Asset xfer
        Gtxn[0].type_enum() == TxnType.AssetTransfer,
        Gtxn[0].rekey_to() == Global.zero_address(),
        # Is for platform token
        Gtxn[0].xfer_asset() == platform_token,
        # Is from creator, to platform account
        Gtxn[0].asset_receiver() == platform_account,
        Gtxn[0].asset_close_to() == platform_account,
    )

    delist_asa = And(
        # Is safe ASA xfer 
        Gtxn[1].type_enum() == TxnType.AssetTransfer,
        Gtxn[1].rekey_to() == Global.zero_address(),
        # is for asset id token
        Gtxn[1].xfer_asset() == asset_id,
        # rece1iver/close to is platform account
        Gtxn[1].asset_receiver() == creator,
        Gtxn[1].asset_close_to() == creator,
    )

    # Send algo balance back to creator
    delist_algo = And(
        # Is safe payment
        Gtxn[2].type_enum() == TxnType.Payment,
        Gtxn[2].rekey_to() == Global.zero_address(),
        # Is to creator, close  to creator
        Gtxn[2].receiver() == creator,
        Gtxn[2].close_remainder_to() == creator,
        # Is for 0 algo
        Gtxn[2].amount() == Int(0)
    )



    # Delist 
    #   ASA/Algos back to creator 
    #   Platform tokens back to platform account 
    delist = And(
        # Make sure they're all from the same sender (contract acct)
        Gtxn[0].sender() == Gtxn[1].sender(),
        Gtxn[1].sender() == Gtxn[2].sender(),
        delist_algo,
        delist_asa,
        delist_platform
    )

    purchase_algo = And(
        # Is safe payment
        Gtxn[0].type_enum() == TxnType.Payment,
        Gtxn[0].rekey_to() == Global.zero_address(),
        Gtxn[0].close_remainder_to() == Global.zero_address(),
        # Is To creator
        Gtxn[0].receiver() == creator,
        # Is for $PRICE algo
        Gtxn[0].amount() == price
    )

    purchase_asa = And(
        # Is safe asa transfer 
        Gtxn[1].type_enum() == TxnType.AssetTransfer,
        Gtxn[1].rekey_to() == Global.zero_address(),
        # Is To buyer for full amount
        Gtxn[1].asset_receiver() == Gtxn[0].sender(),
        Gtxn[1].asset_close_to() == Gtxn[0].sender(),
        # is for asset id
        Gtxn[1].xfer_asset() == asset_id,
    )

    purchase_platform = And(
        # Is safe platform token close out, creator gets 5 and the rest goes back to platform
        Gtxn[2].type_enum() == TxnType.AssetTransfer,
        Gtxn[2].rekey_to() == Global.zero_address(),
        # is for platform token
        Gtxn[2].xfer_asset() == platform_token,
        # Is to creator, rest to platform account
        Gtxn[2].asset_receiver() == creator,
        Gtxn[2].asset_close_to() == platform_account,
        # is for 1 tokens
        Gtxn[2].asset_amount() == Int(1)
    )

    purchase_fee = And(
        Gtxn[3].type_enum() == TxnType.Payment,
        Gtxn[3].rekey_to() == Global.zero_address(),
        # Is to platform, remainder to creator
        Gtxn[3].receiver() == platform_account,
        Gtxn[3].close_remainder_to() == creator,
        # is for fee units
        Gtxn[3].amount() == platform_fee 
    )


    # Purchase
    #   Algo payment to creator 
    #   ASA to sender
    #   Creator gets half a platform token, rest goes back to platform account
    #   Fee to platform account, close out account with algos
    purchase = And(
        purchase_algo,
        purchase_asa,
        purchase_platform,
        purchase_fee
    )

    return Cond([Global.group_size() == Int(1), opt_in],
                [Global.group_size() == Int(3), delist],
                [Global.group_size() == Int(4), purchase])

if __name__ == "__main__":
     prog = listing(price=Int(500), asset_id=Int(2), creator=Addr("LWFFE2TME372URXA4J6T4IK5V72HPLRXHLZQNF2WIV4FWE5H2ZDW5K7GOI"))
     print(compileTeal(prog, Mode.Signature))