from pyteal import And, TxnType, Int, AssetParam, Seq, Global, If, App, Bytes, Concat, Sha512_256,  AssetHolding, Gtxn, OnComplete
from config import *

def tealpath(name):
    return "../" + name.replace("teal", "tmpl.teal")

def valid_app_call(txn, app_id):
    return And(
        txn.type_enum() == TxnType.ApplicationCall,
        txn.on_completion() ==  OnComplete.NoOp,
        txn.application_id() == app_id,
    )

def valid_admin_fee_pay(txn):
    return pay_txn_valid(txn, Int(0), platform_admin, platform_admin)

def valid_platform_asset():
    expr = AssetParam.manager(Int(0))
    return Seq([ expr, expr.value() == platform_addr ])

def valid_contract(tc, contract_source, contract_addr):
    return And(
        tc.get_validate_ops(contract_source),
        Sha512_256(Concat(Bytes("Program"), contract_source)) ==  contract_addr,
    )

def caller_is_listing_creator(contract_addr):
    return Seq([ App.localGet(Int(0), contract_addr) == contract_addr])

def caller_add_listing_addr(contract_addr):
    return Seq([ App.localPut(Int(0), contract_addr, contract_addr), Int(1) ])

def remove_listing_addr(idx, contract_addr):
    return Seq([ App.localDel(idx, contract_addr), Int(1) ])

def set_foreign_asset(txn, idx, var):
    return Seq([ var.store(txn.assets[idx]), Int(1) ])

def set_addr_as_rx(txn, var):
    return Seq([ var.store(txn.receiver()), Int(1) ])

def set_addr_as_asset_rx(txn, var):
    return Seq([ var.store(txn.asset_receiver()), Int(1) ])

def set_addr_as_tx(txn, var):
    return Seq([ var.store(txn.sender()), Int(1) ])

def set_asset_id(txn, var):
    return Seq([ var.store(txn.xfer_asset()), Int(1) ])

def check_balance_match(txn, addr_idx, asset_id):
    expr = AssetHolding.balance(addr_idx, asset_id)
    return Seq([ expr, txn.amount() == expr.value() ])


def pay_txn_valid(txn, amt, from_addr, to_addr):
    return And(
        txn.type_enum()         == TxnType.Payment,
        txn.rekey_to()          == Global.zero_address(),
        txn.close_remainder_to()== Global.zero_address(),

        txn.sender()            == from_addr,
        txn.receiver()          == to_addr,
        txn.amount()            == amt 
    )

def pay_close_txn_valid(txn, from_addr, to_addr, close_addr, amt):
    return And(
        txn.type_enum()         == TxnType.Payment,
        txn.rekey_to()          == Global.zero_address(),
        txn.close_remainder_to()== close_addr,

        txn.sender()            == from_addr,
        txn.receiver()          == to_addr,
        txn.amount()            == amt 
    )

def asa_optout_valid(txn, token_id, from_addr, to_addr):
    return And(
        txn.type_enum()         == TxnType.AssetTransfer,
        txn.asset_close_to()    == to_addr,

        txn.xfer_asset()        == token_id,
        txn.sender()            == from_addr,
        txn.asset_receiver()    == to_addr, 
        txn.asset_amount()      == Int(0)
    )

def asa_optin_valid(txn, token_id, addr):
    return And(
        txn.type_enum()         == TxnType.AssetTransfer,
        txn.asset_close_to()    == Global.zero_address(),

        txn.xfer_asset()        == token_id,
        txn.sender()            == addr,
        txn.asset_receiver()    == addr, 
        txn.asset_amount()      == Int(0),
    )

def asa_close_xfer_valid(txn, token_id, from_addr, to_addr, close_addr):
    return And(
        txn.type_enum()         == TxnType.AssetTransfer,
        txn.asset_close_to()    == close_addr,

        txn.sender()            == from_addr,
        txn.asset_receiver()    == to_addr,
        txn.xfer_asset()        == token_id
    )

def asa_xfer_valid(txn, token_id, amt, from_addr, to_addr):
    return And(
        txn.type_enum()         == TxnType.AssetTransfer,
        txn.asset_close_to()    == Global.zero_address(),

        txn.sender()            == from_addr,
        txn.asset_receiver()    == to_addr,
        txn.asset_amount()      == amt,
        txn.xfer_asset()        == token_id
    )

def asa_cfg_valid(txn, token_id, new_addr):
    return And(
        txn.type_enum()             == TxnType.AssetConfig,
        txn.rekey_to()              == Global.zero_address(),

        txn.config_asset()          == token_id,
        txn.config_asset_manager()  == new_addr,
        txn.config_asset_reserve()  == new_addr,
        txn.config_asset_freeze()   == new_addr,
        txn.config_asset_clawback() == new_addr,
    )

def tag_close_valid(txn, from_addr, to_addr):
    return And(
        txn.type_enum()         == TxnType.AssetTransfer,
        txn.asset_close_to()    == to_addr,

        #TODO: check the asset creator?

        txn.sender()            == from_addr,
        txn.asset_receiver()    == to_addr,
        txn.asset_amount()      == Int(0) 
    )

def valid_tag_closes(start_idx, max_tags, platform_addr, contract_addr):
    valid_ops = []
    for x in range(max_tags):
        idx = x + start_idx
        valid_ops.append(
            # +2 to account for 0 indexed && for last transaction which should not be a tag close
            If(Int(idx) + Int(2) < Global.group_size(),  tag_close_valid(Gtxn[idx], contract_addr, platform_addr), Int(1))
        )

    return And(*valid_ops)


def asa_delete_txn_valid(txn, platform_token_id):
    return Int(1)
