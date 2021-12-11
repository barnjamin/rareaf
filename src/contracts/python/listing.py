from pyteal import ScratchVar, TealType, Tmpl, Cond, Mode, compileTeal
from pyteal.ast.txn import Txn

from config import *
from utils  import *

def listing():
    app_id        = ScratchVar(TealType.uint64)
    nonce         = ScratchVar(TealType.bytes)

    # setup is evaluated at the beginning of the cond
    # used to set template variables, returns 0 so the 
    # condition is not executed 
    setup = Seq([
        app_id.store(       Tmpl.Int(  "TMPL_APP_ID")),
        nonce.store(        Tmpl.Bytes("TMPL_NONCE")),
        Int(0) 
    ])

    # The only logic is to check that the initial transaction group
    # matches what we expect. This group includes a transaction to
    # rekey the listing to the application address so all logic
    # from here forward is done in the application code 
    create = And(
        Global.group_size() == Int(5),

        # Seed 
        Gtxn[0].type_enum() == TxnType.Payment,
        Gtxn[0].amount() >= Int(0),

        # Opt into App 
        Gtxn[1].type_enum() == TxnType.ApplicationCall,
        Gtxn[1].on_completion() == OnComplete.OptIn,
        Gtxn[1].application_id() == app_id.load(),

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
        Gtxn[4].rekey_to() == app_addr_from_id(app_id.load()),
        Gtxn[4].sender() == Gtxn[0].receiver(),
    )

    destroy = And(
        Global.group_size() == Int(3),

        #App call to destroy
        Gtxn[0].type_enum() == TxnType.ApplicationCall,
        Gtxn[0].on_completion() == OnComplete.NoOp,
        Gtxn[0].application_id() == app_id.load(),
        Gtxn[0].application_args[0] == action_delete,

        # opt out of app
        Gtxn[1].type_enum() == TxnType.ApplicationCall,
        Gtxn[1].on_completion() == OnComplete.CloseOut,
        Gtxn[1].application_id() == app_id.load(),

        # send funds back to creator
        Gtxn[2].type_enum() == TxnType.Payment,
        Gtxn[2].amount() == Int(0),
        Gtxn[2].close_remainder_to() != Global.zero_address()
    )

    return Cond([setup,     Int(0)], # NoOp, just sets up tmpl vars
                [Global.group_size()==Int(5),    create], # The only thing we do is check the initial create txn group
                [Global.group_size()==Int(3),    destroy]) # The only thing we do is check the initial create txn group

if __name__ == "__main__":
     with open(tmplpath(configuration['contracts']['listing']), 'w') as f:
        f.write(compileTeal(listing(), Mode.Signature, version=6, assembleConstants=True))
