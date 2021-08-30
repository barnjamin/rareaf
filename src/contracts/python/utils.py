from pyteal import ScratchVar, And, TxnType, Int, AssetParam, Seq, TealType
from pyteal import Global, If, App, Bytes, Concat, Sha512_256, For, GetByte, Exp
from pyteal import AssetHolding, Gtxn, OnComplete, Assert, Substring, Len, Or, Subroutine

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
    return pay_txn_valid(txn, Int(0), tmpl_admin_addr, tmpl_admin_addr)

def valid_tag_token(idx):
    manager = AssetParam.manager(idx)
    name = AssetParam.unitName(idx)
    return Seq([ 
        manager, 
        Assert(manager.hasValue()),
        Assert(manager.value() == tmpl_owner_addr),
        name,
        Assert(name.hasValue()),
        suffix(name.value(), Int(3)) == Bytes("tag") 
    ])


def valid_price_token(idx):
    manager = AssetParam.manager(idx)
    name = AssetParam.unitName(idx)
    return Seq([ 
        manager, 
        Assert(manager.hasValue()),
        Assert(manager.value() == tmpl_owner_addr),
        name,
        Assert(name.hasValue()),
        suffix(name.value(), Int(2)) ==  Bytes("px")
    ])


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
    balance = AssetHolding.balance(addr_idx, asset_id)
    price_asset_id = price_asset(asset_id)
    return Seq([ 
            balance, 
            Assert(balance.hasValue()),
            Or(
                And(
                    price_asset_id == Int(0),
                    txn.type_enum() == TxnType.Payment,
                    txn.amount() == balance.value(), 
                ),
                And(
                    price_asset_id == txn.xfer_asset(),
                    txn.type_enum() == TxnType.AssetTransfer,
                    txn.asset_amount() == balance.value()
                ),
            )
        ])


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


@Subroutine(TealType.uint64)
def price_asset(asset_id):
    name = AssetParam.name(asset_id)
    return Seq([
        name,
        Assert(name.hasValue()),
        atoi(Substring(name.value(),Len(platform_name),Len(name.value())))
    ])

@Subroutine(TealType.uint64)
def strpos(str, char):
    pass


@Subroutine(TealType.bytes)
def suffix(a, len):
    return Substring(a, Len(a) - len, Len(a))

@Subroutine(TealType.uint64)
def atoi(a):
    idx = ScratchVar()
    i = ScratchVar()

    init = idx.store(Int(0))
    cond = idx.load()<Len(a)
    step = idx.store(idx.load() + Int(1))

    return Seq([
        i.store(Int(0)),
        For(init, cond, step).Do(
                i.store(
                    i.load() +
                    (
                        (GetByte(a, idx.load()) - Int(48)) *
                        Exp(Int(10), (Len(a)-idx.load())-Int(1))
                    )
                ),
        ),
        i.load()
    ])