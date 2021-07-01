from pyteal import * 

from config import *
from utils  import *

def listing():
    creator_addr  = ScratchVar(TealType.bytes)
    contract_addr = ScratchVar(TealType.bytes)
    buyer_addr    = ScratchVar(TealType.bytes)
    asset_id      = ScratchVar(TealType.uint64)

    setup = Seq([
        creator_addr.store(Tmpl.Bytes("TMPL_CREATOR_ADDR")),
        asset_id.store(Btoi(Tmpl.Bytes("TMPL_ASSET_ID"))),
        Int(0) # return 0 so this cond case doesnt get executed
    ])

    create = And(
        Global.group_size() == Int(7),
        valid_app_call( Gtxn[0]),
        set_addr_as_rx( Gtxn[1], contract_addr),
        pay_txn_valid(  Gtxn[1], seed_amt, creator_addr.load(), contract_addr.load()),
        asa_optin_valid(Gtxn[2], asset_id.load(), contract_addr.load()),
        asa_optin_valid(Gtxn[3], price_token, contract_addr.load()),
        asa_xfer_valid( Gtxn[4], asset_id.load(), Int(1), creator_addr.load(), contract_addr.load()),
        asa_xfer_valid( Gtxn[5], price_token, Btoi(Gtxn[0].application_args[1]), platform_addr, contract_addr.load()),
        asa_cfg_valid(  Gtxn[6], asset_id.load(), contract_addr.load()),
    )


    delete = And(
        Global.group_size() == Int(5),
        valid_app_call(Gtxn[0]),
        set_addr_as_tx(      Gtxn[1], contract_addr),
        asa_close_xfer_valid(Gtxn[1],  price_token,  contract_addr.load(), platform_addr, platform_addr),
        asa_close_xfer_valid(Gtxn[2], asset_id.load(), contract_addr.load(), creator_addr.load(), creator_addr.load()),
        asa_cfg_valid(       Gtxn[3], asset_id.load(), creator_addr.load()),
        pay_close_txn_valid( Gtxn[4], contract_addr.load(), creator_addr.load(), creator_addr.load(), Int(0)),
    )

    purchase = And(
        Global.group_size() == Int(6),
        valid_app_call(Gtxn[0]),

        set_addr_as_tx(      Gtxn[1], buyer_addr),
        set_addr_as_tx(      Gtxn[2], contract_addr),

        pay_txn_valid(       Gtxn[1], Gtxn[1].amount(), buyer_addr.load(), creator_addr.load()),
        asa_close_xfer_valid(Gtxn[2], asset_id.load(), contract_addr.load(), buyer_addr.load(), buyer_addr.load()),
        asa_close_xfer_valid(Gtxn[3], price_token, contract_addr.load(), platform_addr, platform_addr),
        asa_cfg_valid(       Gtxn[4], asset_id.load(), buyer_addr.load()),
        pay_close_txn_valid( Gtxn[5], contract_addr.load(), platform_addr, creator_addr.load(), platform_fee),
    )

    app_offload = Or(Gtxn[0].application_args[0] == action_tag, Gtxn[0].application_args[0] == action_untag, Gtxn[0].application_args[0] == action_dprice)
    app_validate = valid_app_call(Gtxn[0])

    return Cond([setup, Int(0)], #NoOp
                [Gtxn[0].application_args[0] == action_create,   create], 
                [Gtxn[0].application_args[0] == action_delete,   delete], 
                [Gtxn[0].application_args[0] == action_purchase, purchase],
                [app_offload,   app_validate])


if __name__ == "__main__":
     with open(tealpath(configuration['application']['contracts']['listing']), 'w') as f:
        f.write(compileTeal(listing(), Mode.Signature, version=3, assembleConstants=True))
