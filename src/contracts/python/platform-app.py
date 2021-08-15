from pyteal import ScratchVar, TealType, Return, Btoi, Txn, OnComplete, Mode, Cond, compileTeal

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

    on_creation = Seq([ Return(Int(1)) ])
    on_delete   = Seq([ Return(is_app_creator) ])
    on_closeout = Seq([ Return(is_app_creator) ])
    register    = Seq([ Return(Int(1)) ])


    create_listing = And(
        set_addr_as_rx(Gtxn[1], contract_addr),
        set_addr_as_tx(Gtxn[1], creator_addr),

        Seq([ price.store(Btoi(Txn.application_args[1])), Int(1) ]),

        # We're creating a contract account with the right behavior
        valid_contract(tc, Txn.application_args[2], contract_addr.load()),

        # Save it in creators local state
        caller_add_listing_addr(contract_addr.load()),
        price.load() <= max_price,
    )

    # TODO, check that contract doesnt already hold 1
    tag_listing = And( 
        Global.group_size() == Int(3),
        valid_platform_asset(), # first and only foreign arg
        set_foreign_asset(Gtxn[0], 0, tag_id),
        set_addr_as_tx(   Gtxn[1], contract_addr),

        caller_is_listing_creator(contract_addr.load()),

        asa_optin_valid(  Gtxn[1], tag_id.load(), contract_addr.load() ),
        asa_xfer_valid(   Gtxn[2], tag_id.load(), Int(1), platform_addr, contract_addr.load())
    )

    untag_listing = And(
        Global.group_size() == Int(2),
        set_foreign_asset(Gtxn[0], 0, tag_id),
        valid_platform_asset(),
        set_addr_as_tx(Gtxn[1], contract_addr),
        caller_is_listing_creator(contract_addr.load()),
        asa_close_xfer_valid(Gtxn[1], tag_id.load(), contract_addr.load(), platform_addr, platform_addr)
    )

    # TODO, check that new value wont be > max price 
    price_increase_listing = And(
        Global.group_size() == Int(2),
        set_addr_as_asset_rx(Gtxn[1], contract_addr),
        caller_is_listing_creator(contract_addr.load()),
        asa_xfer_valid(Gtxn[1], price_token, Btoi(Txn.application_args[1]), platform_addr, contract_addr.load()), 
    )

    # TODO, check that new price wont be 0 
    price_decrease_listing = And(
        Global.group_size() == Int(2),
        set_addr_as_tx(Gtxn[1], contract_addr),
        caller_is_listing_creator(contract_addr.load()),
        asa_xfer_valid(Gtxn[1], price_token, Btoi(Txn.application_args[1]), contract_addr.load(), platform_addr), 
    )

    delete_listing = And(  
        set_addr_as_tx(Gtxn[1], contract_addr),
        caller_is_listing_creator(contract_addr.load()),

        ## Add logic to check intermediate transactions 
        valid_tag_closes(4, 8, platform_addr, contract_addr.load()),

        remove_listing_addr(Int(0), contract_addr.load()),
    )

    purchase_listing = And(  
        # Make sure payment is going to creator
        Gtxn[1].receiver() == Gtxn[0].accounts[1],

        set_addr_as_tx(Gtxn[2], contract_addr),

        # Make sure payment amount is right 
        check_balance_match(Gtxn[1], Int(2), price_token),

        ## Add logic to check intermediate transactions 
        valid_tag_closes(5, 8, platform_addr, contract_addr.load()),

        # Remove the contract addr from the creators acct
        remove_listing_addr(Int(1), contract_addr.load()), 
    )


    delist_listing = And(  
        # Sent by admin
        Gtxn[0].sender() == Global.creator_address() ,

        set_addr_as_tx(Gtxn[1], contract_addr),
        valid_tag_closes(4, 8, platform_addr, contract_addr.load()),

        remove_listing_addr(Int(1), contract_addr.load()),
    )


    return Cond(
        [Txn.application_id() == Int(0),                        on_creation],
        [Txn.on_completion()  == OnComplete.DeleteApplication,  on_delete],
        [Txn.on_completion()  == OnComplete.UpdateApplication,  Return(is_app_creator)],
        [Txn.on_completion()  == OnComplete.CloseOut,           on_closeout],
        [Txn.on_completion()  == OnComplete.OptIn,              register],

        [Txn.application_args[0] == action_create,      Return(create_listing)],  # App approve price tokens && adds listing to local state
        [Txn.application_args[0] == action_tag,         Return(tag_listing)],     # App approves manager of token requested
        [Txn.application_args[0] == action_untag,       Return(untag_listing)],   # App approves untag coming from listing creator
        [Txn.application_args[0] == action_dprice,      Return(price_decrease_listing)], # App validates caller 
        [Txn.application_args[0] == action_iprice,      Return(price_increase_listing)], # App validates caller 
        [Txn.application_args[0] == action_delete,      Return(delete_listing)],    # App approves sender owns listing
        [Txn.application_args[0] == action_purchase,    Return(purchase_listing)],  # App removes listing from local state
        [Txn.application_args[0] == action_safety,      Return(delist_listing)]     # App removes listing from local state
    )


def clear():
    return Int(1)



if __name__ == "__main__":
    with open(tealpath(configuration['contracts']['approval']), "w") as pa_file:
        pa_file.write(compileTeal(approval(), Mode.Application, version=4, assembleConstants=True))

    with open(tealpath(configuration['contracts']['clear']), "w") as pc_file:
        pc_file.write(compileTeal(clear(), Mode.Application, version=4, assembleConstants=True))
