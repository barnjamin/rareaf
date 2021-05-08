from pyteal import *
from config import *


config = get_config()

def listing():

    creator  = ScratchVar(TealType.bytes)
    price    = ScratchVar(TealType.uint64)
    asset_id = ScratchVar(TealType.uint64)

    platform_token = ScratchVar(TealType.uint64)
    platform_fee   = ScratchVar(TealType.uint64)
    platform_addr  = ScratchVar(TealType.bytes)

    setup = Seq([
        creator.store(Tmpl.PushBytes("TMPL_CREATOR_ADDR")),
        price.store(Btoi(Tmpl.PushBytes("TMPL_PRICE_MICROALGOS"))),
        asset_id.store(Btoi(Tmpl.PushBytes("TMPL_ASSET_ID"))),

        platform_token.store(Int(config['token']['id'])),
        platform_fee.store(Int(int(config['fee']))),
        platform_addr.store(Addr(config['address'])),

        Int(0) # return 0 so this cond case doesnt get executed
    ])

    opt_in_asa = And(
       Txn.type_enum() == TxnType.AssetTransfer,
       Txn.asset_close_to() == Global.zero_address(),
       Txn.rekey_to() == Global.zero_address(),
       Txn.xfer_asset() == asset_id.load(),
       Txn.asset_amount() == Int(0),
    )

    opt_in_platform = And(
       Txn.type_enum() == TxnType.AssetTransfer,
       Txn.asset_close_to() == Global.zero_address(),
       Txn.rekey_to() == Global.zero_address(),
       Txn.xfer_asset() == platform_token.load(),
       Txn.asset_amount() == Int(0),
    )

    opt_in = Or(opt_in_asa, opt_in_platform)

    # Send Platform tokens back to platform account
    delist_platform = And(
        # Is safe Asset xfer
        Gtxn[0].type_enum() == TxnType.AssetTransfer,
        Gtxn[0].rekey_to() == Global.zero_address(),
        # Is for platform token
        Gtxn[0].xfer_asset() == platform_token.load(),
        # Is from creator, to platform account
        Gtxn[0].asset_receiver() == platform_addr.load(),
        Gtxn[0].asset_close_to() == platform_addr.load(),
    )

    delist_asa = And(
        # Is safe ASA xfer 
        Gtxn[1].type_enum() == TxnType.AssetTransfer,
        Gtxn[1].rekey_to() == Global.zero_address(),
        # is for asset id token
        Gtxn[1].xfer_asset() == asset_id.load(),
        # rece1iver/close to is platform account
        Gtxn[1].asset_receiver() == creator.load(),
        Gtxn[1].asset_close_to() == creator.load(),
    )

    # Send algo balance back to creator
    delist_cfg = And(
        # Is safe payment
        Gtxn[2].type_enum() == TxnType.AssetConfig,
        Gtxn[2].rekey_to() == Global.zero_address(),
        Gtxn[2].config_asset()          == asset_id.load(),
        Gtxn[2].config_asset_manager()  == creator.load(),
        Gtxn[2].config_asset_reserve()  == creator.load(),
        Gtxn[2].config_asset_freeze()   == creator.load(),
        Gtxn[2].config_asset_clawback() == creator.load(),
    )

    # Send algo balance back to creator
    delist_algo = And(
        # Is safe payment
        Gtxn[3].type_enum() == TxnType.Payment,
        Gtxn[3].rekey_to() == Global.zero_address(),
        # Is to creator, close  to creator
        Gtxn[3].receiver() == creator.load(),
        Gtxn[3].close_remainder_to() == creator.load(),
        # Is for 0 algo
        Gtxn[3].amount() == Int(0)
    )

    # Delist 
    #   ASA/Algos back to creator 
    #   Platform tokens back to platform account 
    delist = And(
        # Make sure they're all from the same sender (contract acct)
        Gtxn[0].sender() == Gtxn[1].sender(),
        Gtxn[1].sender() == Gtxn[3].sender(),
        delist_platform,
        delist_asa,
        delist_cfg,
        delist_algo,
    )

    purchase_algo = And(
        # Is safe payment
        Gtxn[0].type_enum() == TxnType.Payment,
        Gtxn[0].rekey_to() == Global.zero_address(),
        Gtxn[0].close_remainder_to() == Global.zero_address(),
        # Is To creator
        Gtxn[0].receiver() == creator.load(),
        # Is for $PRICE algo
        Gtxn[0].amount() == price.load()
    )

    purchase_asa = And(
        # Is safe asa transfer 
        Gtxn[1].type_enum() == TxnType.AssetTransfer,
        Gtxn[1].rekey_to() == Global.zero_address(),
        # Is To buyer for full amount
        Gtxn[1].asset_receiver() == Gtxn[0].sender(),
        Gtxn[1].asset_close_to() == Gtxn[0].sender(),
        # is for asset id
        Gtxn[1].xfer_asset() == asset_id.load(),
    )

    purchase_platform = And(
        # Is safe platform token close out, creator gets 5 and the rest goes back to platform
        Gtxn[2].type_enum() == TxnType.AssetTransfer,
        Gtxn[2].rekey_to() == Global.zero_address(),
        # is for platform token
        Gtxn[2].xfer_asset() == platform_token.load(),
        # Is to creator, rest to platform account
        Gtxn[2].asset_receiver() == platform_addr.load(),
        Gtxn[2].asset_close_to() == platform_addr.load(),
        # is for 1 tokens
        Gtxn[2].asset_amount() == Int(1)
    )

    purchase_cfg = And(
        Gtxn[3].type_enum()             == TxnType.AssetConfig,
        Gtxn[3].rekey_to()              == Global.zero_address(),
        Gtxn[3].config_asset()          == asset_id.load(),
        Gtxn[3].config_asset_manager()  == Gtxn[0].sender(),
        Gtxn[3].config_asset_reserve()  == Gtxn[0].sender(),
        Gtxn[3].config_asset_freeze()   == Gtxn[0].sender(),
        Gtxn[3].config_asset_clawback() == Gtxn[0].sender(),
    )

    purchase_fee = And(
        Gtxn[4].type_enum() == TxnType.Payment,
        Gtxn[4].rekey_to() == Global.zero_address(),
        Gtxn[4].receiver() == platform_addr.load(),
        Gtxn[4].close_remainder_to() == creator.load(),
        Gtxn[4].amount() == platform_fee.load()
    )

    purchase = And(
        purchase_algo,    # Algo payment to creator 
        purchase_asa,     # ASA to sender
        purchase_platform,# Platform token goes back to platform acct
        purchase_cfg,
        purchase_fee      # Fee to platform account, close out account with algos
    )

    return Cond([setup, Int(0)], #NoOp
                [Global.group_size() == Int(1), opt_in], 
                [Global.group_size() == Int(4), delist], 
                [Global.group_size() == Int(5), purchase])


if __name__ == "__main__":
     prog = listing()
     print(compileTeal(prog, Mode.Signature, version=3))