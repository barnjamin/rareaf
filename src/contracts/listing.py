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
        # Set var
        set_addr_as_rx(Gtxn[1], contract_addr),

        # Seed it
        pay_txn_valid(Gtxn[1], seed_amt, creator_addr.load(), contract_addr.load()),

        # Opt into ASA and price tokens
        asa_optin_valid(Gtxn[2], asset_id.load(), contract_addr.load()),
        asa_optin_valid(Gtxn[3], price_token, contract_addr.load()),

        # Receive ASA and price tokens
        asa_xfer_valid( Gtxn[4], asset_id.load(), Int(1), creator_addr.load(), contract_addr.load()),
        asa_xfer_valid( Gtxn[5], price_token, Btoi(Args(1)), platform_addr, contract_addr.load()),

        # Reconfigure ASA to contract addr
        asa_cfg_valid(  Gtxn[6], asset_id.load(), contract_addr.load()),
    )

    #TODO: allow opt-in for tags

    #   Platform tokens back to platform account 
    delete = And(
        set_addr_as_tx(Gtxn[0], contract_addr),
        asa_close_xfer_valid(Gtxn[0],  price_token,  contract_addr.load(), platform_addr, platform_addr),
        asa_close_xfer_valid(Gtxn[1], asset_id.load(), contract_addr.load(), creator_addr.load(), creator_addr.load()),
        asa_cfg_valid(Gtxn[2], asset_id.load(), creator_addr.load()),
        pay_close_txn_valid(Gtxn[3], contract_addr.load(), creator_addr.load(), creator_addr.load(), Int(0)),
    )

    purchase = And(
        set_addr_as_tx(Gtxn[0], buyer_addr),
        set_addr_as_tx(Gtxn[1], contract_addr),
        #TODO: need to validate this txn in app so we can lookup balance of price tokens pay_txn_valid(Gtxn[0], , buyer_addr.load(), creator_addr.load()),
        asa_close_xfer_valid(Gtxn[1], asset_id.load(), contract_addr.load(), buyer_addr.load(), buyer_addr.load()),
        asa_close_xfer_valid(Gtxn[2], price_token, contract_addr.load(), platform_addr, platform_addr),
        asa_cfg_valid(Gtxn[3], asset_id.load(), buyer_addr.load()),
        pay_close_txn_valid(Gtxn[4], contract_addr.load(), platform_addr, creator_addr.load(), platform_fee),
    )
    tag = Int(1)
    reprice = Int(1)


    return Cond([setup, Int(0)], #NoOp
                [Arg(0) == Bytes("create"), create], 
                [Arg(0) == Bytes("delete"), delete], 
                [Arg(0) == Bytes("tag"), tag],
                [Arg(0) == Bytes("reprice"), reprice],
                [Arg(0) == Bytes("purchase"), purchase])

if __name__ == "__main__":
     with open(configuration['listing']['template'], 'w') as f:
        f.write(compileTeal(listing(), Mode.Signature, version=3, assembleConstants=True))