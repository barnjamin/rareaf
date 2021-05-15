from pyteal import *
from config import *


def valid_set_tag(txn, tag_var):
    return Seq([ 
            Assert(
                App.globalGet( Concat(tag_key, Itob(txn.xfer_asset()))
                ) == Bytes("true")
            ), 
            tag_var.store(txn.xfer_asset()),
            Int(1) 
        ])


def valid_contract(tc, contract_source, contract_addr):
    return And(
        tc.get_validate_ops(contract_source),
        Sha512_256(Concat(Bytes("Program"), contract_source)) ==  contract_addr,
    )

def caller_is_listing_creator(contract_addr):
    return App.localGet(Int(0), contract_addr)

def caller_add_listing_addr(contract_addr):
    App.localPut(Int(0), contract_addr, contract_addr)
    return Int(1)

# Account of creator passed into accounts arg
def remove_listing_addr(idx, contract_addr):
    App.localDel(idx, contract_addr)
    return Int(1)


def set_addr_as_rx(txn, var):
    return Seq([var.store(txn.receiver()), Int(1)])

def set_addr_as_tx(txn, var):
    return Seq([ var.store(txn.sender()), Int(1)])


def pay_txn_valid(txn, amt, from_addr, to_addr):
    return And(
        txn.type_enum() == TxnType.Payment,
        txn.rekey_to() == Global.zero_address(),
        txn.close_remainder_to() == Global.zero_address(),
        txn.sender() == from_addr,
        txn.receiver() == to_addr,
        txn.amount() ==  amt 
    )

def pay_close_txn_valid(txn, from_addr, to_addr, close_addr, amt):
    return And(
        txn.type_enum() == TxnType.Payment,
        txn.rekey_to() == Global.zero_address(),
        txn.close_remainder_to() == close_addr,
        txn.sender() == from_addr,
        txn.receiver() == to_addr,
        txn.amount() ==  amt 
    )

def asa_optout_valid(txn, token_id, from_addr, to_addr):
    return And(
        txn.type_enum() == TxnType.AssetTransfer,
        txn.rekey_to() == Global.zero_address(),
        txn.xfer_asset() == token_id,
        txn.sender() == from_addr,
        txn.asset_receiver() == to_addr, 
        txn.asset_close_to() == to_addr,
        txn.asset_amount() == Int(0)
    )

def asa_optin_valid(txn, token_id, addr):
    return And(
        txn.type_enum() == TxnType.AssetTransfer,
        txn.rekey_to() == Global.zero_address(),
        txn.xfer_asset() == token_id,
        txn.sender() == addr,
        txn.asset_receiver() == addr, 
        txn.asset_amount() == Int(0),
    )

def asa_close_xfer_valid(txn, token_id, from_addr, to_addr, close_addr):
    return And(
        txn.type_enum() == TxnType.AssetTransfer,
        txn.rekey_to() == Global.zero_address(),
        txn.asset_close_to() == close_addr,
        txn.sender() == from_addr,
        txn.asset_receiver() == to_addr,
        txn.xfer_asset() == token_id
    )

def asa_xfer_valid(txn, token_id, amt, from_addr, to_addr):
    return And(
        txn.type_enum() == TxnType.AssetTransfer,
        txn.rekey_to() == Global.zero_address(),
        txn.asset_close_to() == Global.zero_address(),
        txn.sender() == from_addr,
        txn.asset_receiver() == to_addr,
        txn.asset_amount() == amt,
        txn.xfer_asset() == token_id
    )

def asa_cfg_valid(txn, token_id, new_addr):
    return And(
        txn.type_enum() == TxnType.AssetConfig,
        txn.rekey_to() == Global.zero_address(),
        txn.config_asset()          == token_id,
        txn.config_asset_manager()  == new_addr,
        txn.config_asset_reserve()  == new_addr,
        txn.config_asset_freeze()   == new_addr,
        txn.config_asset_clawback() == new_addr,
    )

def tag_close_valid(txn, from_addr, to_addr):
    return And(
        txn.type_enum() == TxnType.AssetTransfer,
        txn.rekey_to() == Global.zero_address(),
        txn.asset_close_to() == to_addr,
        txn.sender() == from_addr,
        txn.asset_receiver() == to_addr,
        txn.asset_amount() == Int(0) 
    )

def valid_tag_closes(start_idx, max_tags, platform_addr, contract_addr):
    valid_ops = []
    for x in range(max_tags):
        idx = x + start_idx
        valid_ops.append(
            If(Global.group_size()-Int(1) > Int(idx),  tag_close_valid(Gtxn[idx], platform_addr, contract_addr), Int(1))
        )

    return And(*valid_ops)


def asa_delete_txn_valid(txn, platform_token_id):
    return Int(1)
