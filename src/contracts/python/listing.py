from pyteal import ScratchVar, TealType, Tmpl, Or, Btoi, Cond, Mode, compileTeal

from config import *
from utils  import *

def listing():
    creator_addr  = ScratchVar(TealType.bytes)
    contract_addr = ScratchVar(TealType.bytes)
    buyer_addr    = ScratchVar(TealType.bytes)
    asset_id      = ScratchVar(TealType.uint64)

    app_id        = ScratchVar(TealType.uint64)
    price_token   = ScratchVar(TealType.uint64)

    setup = Seq([
        creator_addr.store(Tmpl.Bytes("TMPL_CREATOR_ADDR")),
        asset_id.store(Btoi(Tmpl.Bytes("TMPL_ASSET_ID"))),

        app_id.store(tmpl_app_id),
        price_token.store(tmpl_price_token),
        Int(0) # return 0 so this cond case doesnt get executed
    ])

    create = And(
        Global.group_size() == Int(7),
        valid_app_call( Gtxn[0], app_id.load()),
        set_addr_as_rx( Gtxn[1], contract_addr),
        pay_txn_valid(  Gtxn[1], tmpl_seed_amt, creator_addr.load(), contract_addr.load()),
        asa_optin_valid(Gtxn[2], asset_id.load(), contract_addr.load()),
        asa_optin_valid(Gtxn[3], price_token.load(), contract_addr.load()),
        asa_xfer_valid( Gtxn[4], asset_id.load(), Int(1), creator_addr.load(), contract_addr.load()),

        # Checking this in the app logic since we need to validate price token 
        asa_xfer_valid( Gtxn[5], Gtxn[0].assets[0], Btoi(Gtxn[0].application_args[1]), tmpl_owner_addr, contract_addr.load()),

        asa_cfg_valid(  Gtxn[6], asset_id.load(), contract_addr.load()),
    )


    delete = And(
        Global.group_size() >= Int(5),
        valid_app_call(Gtxn[0], app_id.load()),

        set_addr_as_tx(      Gtxn[1], contract_addr),
        asa_close_xfer_valid(Gtxn[1], Gtxn[0].assets[0],  contract_addr.load(), tmpl_owner_addr, tmpl_owner_addr),

        asa_close_xfer_valid(Gtxn[2], asset_id.load(), contract_addr.load(), creator_addr.load(), creator_addr.load()),
        asa_cfg_valid(       Gtxn[3], asset_id.load(), creator_addr.load()),
        
        # Possible Tag closes

        pay_close_txn_valid( Gtxn[Global.group_size() - Int(1)], contract_addr.load(), creator_addr.load(), creator_addr.load(), Int(0)),
    )

    purchase = And(
        Global.group_size() >= Int(6),
        valid_app_call(Gtxn[0], app_id.load()),

        set_addr_as_tx(      Gtxn[1], buyer_addr),
        set_addr_as_tx(      Gtxn[2], contract_addr),

        pay_txn_valid(       Gtxn[1], Gtxn[1].amount(), buyer_addr.load(), creator_addr.load()),
        asa_close_xfer_valid(Gtxn[2], asset_id.load(), contract_addr.load(), buyer_addr.load(), buyer_addr.load()),
        asa_close_xfer_valid(Gtxn[3], price_token.load(), contract_addr.load(), tmpl_owner_addr, tmpl_owner_addr),
        asa_cfg_valid(       Gtxn[4], asset_id.load(), buyer_addr.load()),

        # Possible Tag closes

        pay_close_txn_valid( Gtxn[Global.group_size() - Int(1)], contract_addr.load(), tmpl_owner_addr, creator_addr.load(), tmpl_fee_amt),
    )

    app_offload = Or(
        Gtxn[0].application_args[0] == action_tag, 
        Gtxn[0].application_args[0] == action_untag, 
        Gtxn[0].application_args[0] == action_dprice,
        Gtxn[0].application_args[0] == action_safety
    )
    app_validate = valid_app_call(Gtxn[0], app_id.load())

    return Cond([setup, Int(0)], #NoOp
                [Gtxn[0].application_args[0] == action_create,   create], 
                [Gtxn[0].application_args[0] == action_delete,   delete], 
                [Gtxn[0].application_args[0] == action_purchase, purchase],
                [app_offload,   app_validate])



if __name__ == "__main__":
     with open(tealpath(configuration['contracts']['listing']), 'w') as f:
        f.write(compileTeal(listing(), Mode.Signature, version=4, assembleConstants=True))
