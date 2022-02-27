from os import access
from pyteal import ScratchVar, TealType, Return, Btoi, Txn, OnComplete, Mode, Cond, compileTeal, GeneratedID, Approve
from pyteal.ast.itxn import InnerTxnBuilder
from pyteal.ast.txn import TxnExprBuilder, TxnField

from utils import *
from config import *

def approval():
    is_app_creator = Global.creator_address() == Txn.sender()

    create_listing = And(
        Global.group_size() == Int(5),

        # Seed 
        Gtxn[0].type_enum() == TxnType.Payment,
        Gtxn[0].amount() >= Int(0),

        # Opt into App 
        Gtxn[1].type_enum() == TxnType.ApplicationCall,
        Gtxn[1].on_completion() == OnComplete.OptIn,
        Gtxn[1].application_id() == Global.current_application_id(),

        # Opt into NFT
        Gtxn[2].type_enum() == TxnType.AssetTransfer,
        Gtxn[2].asset_amount() == Int(0),
        Gtxn[2].sender() == Gtxn[3].asset_receiver(),
        Gtxn[2].xfer_asset() == Gtxn[3].xfer_asset(),

        # Receive NFT 
        Gtxn[3].type_enum() == TxnType.AssetTransfer,
        Gtxn[3].asset_amount() > Int(0),
        Gtxn[3].sender() == Gtxn[0].sender(),
        Gtxn[3].asset_receiver() == Gtxn[0].receiver(),

        # Rekey to App Addr
        Gtxn[4].type_enum() == TxnType.Payment,
        Gtxn[4].amount() == Int(0),
        Gtxn[4].rekey_to() == Global.current_application_address(),
        Gtxn[4].sender() == Gtxn[0].receiver(),

        # Rekey to App Addr
        Gtxn[4].type_enum() == TxnType.Payment,
        Gtxn[4].amount()    == Int(0),
        Gtxn[4].rekey_to()  == Global.current_application_address(),
        Gtxn[4].sender()    == Gtxn[0].receiver(),

        #Set the local storage creator to the funding sender 
        Seq(
            App.localPut(Gtxn[0].receiver(), owner_key, Gtxn[0].sender()),
            App.localPut(Gtxn[0].receiver(), asset_key, Gtxn[4].xfer_asset()),
            Int(1)
        )
    )

    tag_listing = And( 
        Global.group_size() == Int(1),
        valid_owner_app_call(Txn.accounts[1]),
        valid_tag_token(Txn.assets[0]),
        valid_listing_addr(Txn.accounts[1]),
        ensure_opted_in(Txn.accounts[1], Txn.assets[0]),
        ensure_token_balance(Txn.accounts[1], Txn.assets[0], Int(1))
    )

    untag_listing = And(
        Global.group_size() == Int(1),
        valid_owner_app_call(Txn.accounts[1]),
        valid_tag_token(Txn.assets[0]),
        valid_listing_addr(Txn.accounts[1]),
        ensure_token_balance(Txn.accounts[1], Txn.assets[0], Int(0))
    )

    reprice_listing = And(
        Global.group_size() == Int(1),
        valid_owner_app_call(Txn.accounts[1]),
        valid_price_token(Txn.assets[0]),
        valid_listing_addr(Txn.accounts[1]),
        ensure_opted_in(Txn.accounts[1], Txn.assets[0]),
        ensure_token_balance(Txn.accounts[1], Txn.assets[0], Btoi(Txn.application_args[1]))
    )

    owner = ScratchVar()
    asset = ScratchVar()

    delete_listing = And( 
        Global.group_size() == Int(3),
        Or(
            valid_owner_app_call(Gtxn[0].accounts[1]),
            valid_admin_app_call()
        ),

        Seq(
            owner.store(App.localGet(Gtxn[0].accounts[1], owner_key)),
            asset.store(App.localGet(Gtxn[0].accounts[1], asset_key)),
            Int(1)
        ),

        # Xfer tags/prices back to app
        empty_app_tokens(Txn.accounts[1], Txn.assets, Int(1)),

        # Xfer nft back to owner
        Seq(
            InnerTxnBuilder.Begin(),
            InnerTxnBuilder.SetFields({
                TxnField.type_enum: TxnType.AssetTransfer,
                TxnField.xfer_asset: Gtxn[0].assets[0], 
                TxnField.asset_amount: Int(0),
                TxnField.sender: Gtxn[0].accounts[1],
                TxnField.asset_close_to: owner.load() 
            }),
            InnerTxnBuilder.Submit(),
            Int(1)
        ),

        # Rekey back to listing auth
        Seq(
            InnerTxnBuilder.Begin(),
            InnerTxnBuilder.SetFields({
                TxnField.type_enum: TxnType.Payment,
                TxnField.amount: Int(0),
                TxnField.sender: Gtxn[0].accounts[1],
                TxnField.rekey_to: Gtxn[0].accounts[1],
            }),
            InnerTxnBuilder.Submit(),
            Int(1)
        ),



        # opt out of app
        Gtxn[1].type_enum() == TxnType.ApplicationCall,
        Gtxn[1].on_completion() == OnComplete.CloseOut,
        Gtxn[1].application_id() == Global.current_application_id(),
        Gtxn[1].sender() == Txn.accounts[1],

        # send funds back to creator
        Gtxn[2].type_enum() == TxnType.Payment,
        Gtxn[2].sender() == Txn.accounts[1],
        Gtxn[2].amount() == Int(0),
        Gtxn[2].close_remainder_to() == owner.load()
    )


    purchase_listing = And(  
        Global.group_size() == Int(2),

        Txn.type_enum() == TxnType.ApplicationCall,
        Txn.application_id() == Global.current_application_id(),

        Seq(
            owner.store(App.localGet(Txn.accounts[1], owner_key)),
            asset.store(App.localGet(Txn.accounts[1], asset_key)),
            Int(1)
        ),

        Gtxn[1].sender() == Gtxn[0].sender(),
        Gtxn[1].receiver() == owner.load(),
        check_balance_match(Gtxn[1], Txn.accounts[0], Btoi(Gtxn[0].application_args[1])), #Need to pass the id of the app asset to pay with

        # Xfer tags/prices back to app
        empty_app_tokens(Txn.accounts[1], Gtxn[0].application_args, Int(2)),

        # Xfer nft to buyer  
        Seq(
            InnerTxnBuilder.Begin(),
            InnerTxnBuilder.SetFields({
                TxnField.type_enum: TxnType.AssetTransfer,
                TxnField.asset_amount: Int(0),
                TxnField.asset_close_to: Txn.sender()
            }),
            InnerTxnBuilder.Submit(),
            Int(1)
        ),

        # Rekey back to listing auth
        Seq(
            InnerTxnBuilder.Begin(),
            InnerTxnBuilder.SetFields({
                TxnField.type_enum: TxnType.Payment,
                TxnField.amount: Int(0),
                TxnField.rekey_to: Txn.accounts[1]
            }),
            InnerTxnBuilder.Submit(),
            Int(1)
        ),


        # opt out of app
        Gtxn[1].type_enum() == TxnType.ApplicationCall,
        Gtxn[1].on_completion() == OnComplete.CloseOut,
        Gtxn[1].application_id() == Global.current_application_id(),
        Gtxn[1].sender() == Txn.accounts[1],

        # send funds back to creator
        Gtxn[2].type_enum() == TxnType.Payment,
        Gtxn[2].sender() == Txn.accounts[1],
        Gtxn[2].amount() == Int(0),
        Gtxn[2].close_remainder_to() == owner.load()
    )

    # Admin stuff
    create_price_token = And(
        Global.group_size() == Int(1),
        valid_admin_app_call(),
        price_token_create(price_unit_name, Txn.assets[0])
    )

    destroy_price_token = And(
        Global.group_size() == Int(1),
        valid_admin_app_call(),
        valid_price_token(Txn.assets[0]),
        destroy_token(Txn.assets[0]),
    )

    create_tag_token = And(
        Global.group_size() == Int(1),
        valid_admin_app_call(),
        tag_token_create(tag_unit_name, Txn.application_args[1])
    )

    destroy_tag_token = And(
        Global.group_size() == Int(1),
        valid_admin_app_call(),
        valid_tag_token(Txn.assets[0]),
        destroy_token(Txn.assets[0]),
    )

    application_config = And(
        Global.group_size() == Int(1),
        valid_admin_app_call(),
        #TODO
        Int(1)
    )



    return Cond(
        # App lifecycle
        [Txn.application_id() == Int(0),                        Return(Int(1))],
        [Txn.on_completion()  == OnComplete.DeleteApplication,  Return(is_app_creator)],
        [Txn.on_completion()  == OnComplete.UpdateApplication,  Return(is_app_creator)],
        [Txn.on_completion()  == OnComplete.CloseOut,           Approve()],

        # Listing actions
        [Txn.on_completion()  == OnComplete.OptIn,     Return(create_listing)],         # Initial create, rekeys to app addr
        [Txn.application_args[0] == action_tag,        Return(tag_listing)],            # Add a tag to the listing
        [Txn.application_args[0] == action_untag,      Return(untag_listing)],          # Remove a tag from the listing
        [Txn.application_args[0] == action_reprice,    Return(reprice_listing)],        # Change one price amount
        [Txn.application_args[0] == action_delete,     Return(delete_listing)],         # Delete the listing
        [Txn.application_args[0] == action_purchase,   Return(purchase_listing)],       # Purchase the listing and close out

        ## App admin
        [Txn.application_args[0] == action_config,          Return(application_config)],     # App sets config vars 
        [Txn.application_args[0] == action_create_price,    Return(create_price_token)],     # App creates a token used for pricing 
        [Txn.application_args[0] == action_destroy_price,   Return(destroy_price_token)],    # App destroys a token used for pricing (needs to have all tokens)
        [Txn.application_args[0] == action_create_tag,      Return(create_tag_token)],       # App creates a token used for tagging
        [Txn.application_args[0] == action_destroy_tag,     Return(destroy_tag_token)]       # App destroys a token used for tagging 
    )


def clear():
    return Int(1)


if __name__ == "__main__":
    with open(tealpath(configuration['contracts']['approval']), "w") as pa_file:
        pa_file.write(compileTeal(approval(), Mode.Application, version=6, assembleConstants=True))

    with open(tealpath(configuration['contracts']['clear']), "w") as pc_file:
        pc_file.write(compileTeal(clear(), Mode.Application, version=6, assembleConstants=True))
