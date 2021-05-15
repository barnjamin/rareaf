from pyteal import *

from validator import *
from utils import *
from config import *


tc = TemplateContract(configuration)
tc.write_tmpl_positions()


creator_addr  = ScratchVar(TealType.bytes)
contract_addr = ScratchVar(TealType.bytes) 

asa_token_id    = ScratchVar(TealType.uint64)
price           = ScratchVar(TealType.uint64)

tag_id          = ScratchVar(TealType.uint64)


def approval():

    is_app_creator = Global.creator_address() == Txn.sender()

    on_creation = Seq([ App.globalPut(listing_key, Txn.application_args[0]), Return(Int(1)) ])
    on_delete   = Seq([ Return(is_app_creator) ])
    on_closeout = Seq([ Return(is_app_creator) ])
    register    = Seq([ Return(Int(1)) ])


    create_listing = And(
        set_addr_as_rx(Gtxn[0], contract_addr),
        set_addr_as_tx(Gtxn[0], creator_addr),
        Seq([price.store(Btoi(Gtxn[0].application_args[1])), Int(1)]),
        # We're creating a contract account with the right behavior
        valid_contract(tc, App.globalGet(listing_key), contract_addr.load()),

        # Save it in creators local state
        caller_add_listing_addr(contract_addr.load()),

        # Make sure sure the price tokens are going to the right address
        asa_optin_valid( Gtxn[1], price_token, contract_addr.load()),
        asa_xfer_valid(  Gtxn[2], price_token, price.load(), creator_addr.load(), contract_addr.load()),
    )

    tag_listing = And( 
        Global.group_size() == Int(2),

        valid_set_tag(Gtxn[0], tag_id),

        set_addr_as_rx(Gtxn[0], contract_addr),
        caller_is_listing_creator(contract_addr.load()),

        asa_optin_valid( Gtxn[0], tag_id.load(), contract_addr.load()),
        asa_xfer_valid(  Gtxn[1], tag_id.load(), Int(1), platform_addr, contract_addr.load())
    )

    reprice_listing = And(
        Global.group_size() == Int(1),
        set_addr_as_rx(Gtxn[0], contract_addr),
        caller_is_listing_creator(contract_addr.load()),
        asa_xfer_valid(Txn, price_token, Btoi(Txn.application_args[0]), platform_addr, contract_addr.load()), 
    )

    delete_listing = And(  
        set_addr_as_tx(Gtxn[0], contract_addr),
        caller_is_listing_creator(contract_addr.load()),
        remove_listing_addr(Int(0), contract_addr.load()),
    )

    purchase_listing = And(  
        set_addr_as_rx(Gtxn[0], contract_addr),
        remove_listing_addr(Int(1), contract_addr.load()), 
    )


    return Cond(
        [Txn.application_id() == Int(0),                        on_creation],
        [Txn.on_completion() == OnComplete.DeleteApplication,   on_delete],
        [Txn.on_completion() == OnComplete.UpdateApplication,   Return(is_app_creator)],
        [Txn.on_completion() == OnComplete.CloseOut,            on_closeout],
        [Txn.on_completion() == OnComplete.OptIn,               register],

        [Txn.application_args[0] == Bytes("create"),   Return(create_listing)],  # App approve price tokens && adds listing to local state
        [Txn.application_args[0] == Bytes("tag"),      Return(tag_listing)],     # App only
        [Txn.application_args[0] == Bytes("reprice"),  Return(reprice_listing)], # App only
        [Txn.application_args[0] == Bytes("delete"),   Return(delete_listing)],  # App approves sender owns listing
        [Txn.application_args[0] == Bytes("purchase"), Return(purchase_listing)] # App removes listing from local state
    )


def clear():
    return Int(1)


if __name__ == "__main__":
    with open(configuration['application']['approval'], "w") as pa_file:
        pa_file.write(compileTeal(approval(), Mode.Application, version=3, assembleConstants=True))

    with open(configuration['application']['clear'], "w") as pc_file:
        pc_file.write(compileTeal(clear(), Mode.Application, version=3, assembleConstants=True))