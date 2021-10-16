from pyteal import ScratchVar, TealType, Tmpl, Cond, Mode, compileTeal
from pyteal.ast.txn import Txn

from config import *
from utils  import *

def listing():
    app_id        = ScratchVar(TealType.uint64)
    app_addr      = ScratchVar(TealType.bytes)
    creator_addr  = ScratchVar(TealType.bytes)
    asset_id      = ScratchVar(TealType.uint64)
    seed_amt      = ScratchVar(TealType.uint64)
    nonce         = ScratchVar(TealType.bytes)

    # setup is evaluated at the beginning of the cond
    # used to set template variables, returns 0 so the 
    # condition is not executed 
    setup = Seq([
        app_id.store(Tmpl.Int("TMPL_APP_ID")),
        app_addr.store(Tmpl.Bytes("TMPL_APP_ADDR")),
        creator_addr.store(Tmpl.Bytes("TMPL_CREATOR_ADDR")),
        asset_id.store(Tmpl.Int("TMPL_ASSET_ID")),
        seed_amt.store(Tmpl.Int("TMPL_SEED_AMT")),
        nonce.store(Tmpl.Bytes("TMPL_NONCE")),
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
        Gtxn[0].amount() >= seed_amt.load(),
        Gtxn[0].sender() == creator_addr.load(),

        # Rekey to App Addr
        Gtxn[1].type_enum() == TxnType.Payment,
        Gtxn[1].amount() == Int(0),
        Gtxn[1].rekey_to() == app_addr.load(),
        Gtxn[1].sender() == Gtxn[0].receiver(),

        # Opt into App 
        Gtxn[2].type_enum() == TxnType.ApplicationCall,
        Gtxn[2].on_completion() == OnComplete.OptIn,
        Gtxn[2].application_id() == app_id.load(),

        # Opt into NFT
        Gtxn[3].type_enum() == TxnType.AssetTransfer,
        Gtxn[3].amount() == Int(0),
        Gtxn[3].sender() == Gtxn[3].receiver(),
        Gtxn[3].xfer_asset() == asset_id.load(),

        # Receive NFT 
        Gtxn[4].type_enum() == TxnType.AssetTransfer,
        Gtxn[4].xfer_asset() == asset_id.load(),
        Gtxn[4].amount() > Int(0),
        Gtxn[4].sender() == Gtxn[0].sender(),
        Gtxn[4].receiver() == Gtxn[0].receiver(),
    )

    return Cond([setup,     Int(0)], # NoOp, just sets up tmpl vars
                [Int(1),    create]) # The only thing we do is check the initial create txn group

if __name__ == "__main__":
     with open(tmplpath(configuration['contracts']['listing']), 'w') as f:
        f.write(compileTeal(listing(), Mode.Signature, version=5, assembleConstants=True))