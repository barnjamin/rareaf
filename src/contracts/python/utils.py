from pyteal import ScratchVar, And, TxnType, Int, AssetParam, Seq, TealType, InnerTxnBuilder, TxnField, Txn, Not, Itob, Pop
from pyteal import Global, If, App, Bytes, Concat, Sha512_256, For, GetByte, Exp, ExtractUint64
from pyteal import AssetHolding, Gtxn, OnComplete, Assert, Substring, Len, Or, Subroutine

from config import *

def tmplpath(name):
    return "../" + name.replace("teal", "tmpl.teal")
def tealpath(name):
    return "../" + name

@Subroutine(TealType.uint64)
def valid_admin_app_call():
    return And(
       Txn.type_enum() == TxnType.ApplicationCall,
       Txn.on_completion() ==  OnComplete.NoOp,
       Txn.application_id() == Global.current_application_id(),
       Txn.sender() == Global.creator_address(),
    )

@Subroutine(TealType.uint64)
def valid_owner_app_call():
    return And(
        Txn.type_enum() == TxnType.ApplicationCall,
        Txn.on_completion() ==  OnComplete.NoOp,
        Txn.application_id() == Global.current_application_id(),
        Txn.sender() == App.localGet(Txn.accounts[0], owner_key)
    )

def valid_tag_token(asset_id):
    manager = AssetParam.manager(asset_id)
    name = AssetParam.unitName(asset_id)
    return Seq(
        manager, name,
        Assert(manager.value() == Global.current_application_address()),
        suffix(name.value(), Int(3)) == Bytes("tag") 
    )

def valid_price_token(asset_id):
    manager = AssetParam.manager(asset_id)
    name = AssetParam.unitName(asset_id)
    return Seq( 
        manager, name,
        Assert(manager.value() == Global.current_application_address()),
        suffix(name.value(), Int(2)) ==  Bytes("px")
    )

def valid_listing_addr(addr):
    return App.optedIn(addr, Global.current_application_id())

@Subroutine(TealType.uint64)
def ensure_opted_in(addr, asset_id):
    ah = AssetHolding.balance(addr, asset_id)
    return Seq(
        ah,
        If(Not(ah.hasValue()))
        .Then( # Need to opt in 
            Seq(
                InnerTxnBuilder.Begin(),
                InnerTxnBuilder.SetFields({
                    TxnField.type_enum: TxnType.AssetTransfer,
                    TxnField.asset_amount: Int(0),
                    TxnField.receiver: Txn.accounts[0],
                    TxnField.sender: Txn.accounts[0],
                }),
                InnerTxnBuilder.Submit(),
                Int(1)
            )
        ),
    )

@Subroutine(TealType.uint64)
def ensure_token_balance(addr, asset_id, amt):
    ah = AssetHolding.balance(addr, asset_id)
    return Seq(
        ah,
        Assert(ah.hasValue()), # Should already be opted in
        If(amt == Int(0)).Then( # Close to app
            Seq(
                InnerTxnBuilder.Begin(),
                InnerTxnBuilder.SetFields({
                    TxnField.type_enum: TxnType.AssetTransfer,
                    TxnField.asset_amount: Int(0),
                    TxnField.xfer_asset: asset_id,
                    TxnField.asset_close_to: Global.current_application_address(),
                    TxnField.sender: addr,
                }),
                InnerTxnBuilder.Submit(),
                Int(1)
            )
        ).ElseIf(amt>ah.value()).Then( # Xfer asset to app addr
            Seq(
                InnerTxnBuilder.Begin(),
                InnerTxnBuilder.SetFields({
                    TxnField.type_enum: TxnType.AssetTransfer,
                    TxnField.asset_amount: amt - ah.value(),
                    TxnField.receiver: Global.current_application_address(),
                }),
                InnerTxnBuilder.Submit(),
                Int(1)
            )
        ).ElseIf(amt<ah.value()).Then( # Xfer asset to addr
            Seq(
                InnerTxnBuilder.Begin(),
                InnerTxnBuilder.SetFields({
                    TxnField.type_enum: TxnType.AssetTransfer,
                    TxnField.asset_amount: ah.value() - amt,
                    TxnField.receiver: addr,
                }),
                InnerTxnBuilder.Submit(),
                Int(1)
            )
        ).Else(Int(1)), # already has the right amount
    )


def price_token_create(tag, asset_id):
    ac = AssetParam.creator(asset_id)
    return Seq(
        ac,
        Assert(ac.hasValue()),
        create_token(tag, Concat(
            Bytes(configuration['application']['unit']), 
            Bytes(":"), 
            itoa(asset_id)
        ))
    )

def tag_token_create(tag, name):
    return create_token(tag, name)

@Subroutine(TealType.uint64)
def create_token(tag, name):
    return Seq(
            InnerTxnBuilder.Begin(),
            InnerTxnBuilder.SetFields({
                TxnField.type_enum: TxnType.AssetConfig,
                TxnField.config_asset_unit_name: tag,
                TxnField.config_asset_name: name,
                TxnField.config_asset_manager: Global.current_application_address(),
                TxnField.config_asset_clawback: Global.current_application_address(),
                TxnField.config_asset_reserve: Global.current_application_address(),
                TxnField.config_asset_freeze: Global.current_application_address(),
                TxnField.config_asset_total: Int(10000000000),
                TxnField.config_asset_decimals: Int(0),
                TxnField.config_asset_url: Concat(Bytes(configuration['domain']), Bytes("/tag/"), name)
            }),
            InnerTxnBuilder.Submit(),
            Int(1)
        )

@Subroutine(TealType.uint64)
def destroy_token(asset_id):
    return Seq(
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.AssetConfig,
            TxnField.config_asset: asset_id,
        }),
        InnerTxnBuilder.Submit(),
        Int(1)
    )

def app_addr_from_id(id):
    return Sha512_256(
        Concat(Bytes("appID"), Itob(id))
    ) 

def empty_app_tokens(addr, args, idx):
    i = ScratchVar() 
    init = i.store(idx)
    cond = i.load()<args.length()
    iter = i.store(i.load() + Int(1))
    return Seq(
        For(init, cond, iter).Do(
            Pop(ensure_token_balance(addr, Btoi(args[i.load()]), Int(0)))
        ),
        Int(1)
    )

def check_balance_match(txn, addr, asset_id):
    balance = AssetHolding.balance(addr, asset_id)
    price_asset_id = price_id(asset_id)
    return Seq(
            balance, 
            Assert(balance.hasValue()),
            Or(
                And(
                    price_asset_id == Int(0),
                    txn.type_enum() == TxnType.Payment,
                    txn.amount() == balance.value(), 
                ),
                And(
                    txn.xfer_asset() == price_asset_id,
                    txn.type_enum() == TxnType.AssetTransfer,
                    txn.asset_amount() == balance.value()
                ),
            )
        )


ascii_offset = Int(48)  # Magic number to convert between ascii chars and integers 

@Subroutine(TealType.uint64)
def price_id(asset_id):
    name = AssetParam.name(asset_id)
    return Seq([
        name,
        Assert(name.hasValue()),
        atoi(Substring(name.value(),Len(platform_name),Len(name.value())))
    ])

@Subroutine(TealType.bytes)
def suffix(a, len):
    return Substring(a, Len(a) - len, Len(a))

@Subroutine(TealType.uint64)
def ascii_to_int(arg: TealType.uint64):
    return arg - ascii_offset

@Subroutine(TealType.bytes)
def int_to_ascii(arg: TealType.uint64):
    #return arg + ascii_offset Just returns a uint64, cant convert to bytes type
    return Substring(Bytes("0123456789"), arg, arg+Int(1))
 
@Subroutine(TealType.uint64)
def atoi(a: TealType.bytes):
    return If(
            Len(a) > Int(0),
            ( ascii_to_int(head(a)) * ilog10(Len(a)-Int(1)) ) + atoi( Substring(a,Int(1),Len(a)) ),
            Int(0)
        )

@Subroutine(TealType.bytes)
def itoa(i: TealType.uint64):
    return If(
            i == Int(0),
            Bytes("0"),
            Concat( 
                If(i / Int(10)>Int(0), itoa(i/Int(10)), Bytes("")), 
                int_to_ascii(i % Int(10)) 
            )
        )


@Subroutine(TealType.uint64)
def head(s: TealType.bytes):
    return GetByte(s, Int(0))

@Subroutine(TealType.bytes)
def tail(s: TealType.bytes):
    return Substring(s, Int(1), Len(s))

@Subroutine(TealType.uint64)
def ilog10(x: TealType.uint64):
    return Exp(Int(10), x)

@Subroutine(TealType.uint64)
def add_to_localstate(addr, key, asset_id):

    idlist = ScratchVar()
    i      = ScratchVar()

    init = i.store(Int(0))
    iter = i.load()<Len(idlist.load())/Int(8)
    incr = i.store(i.load() + Int(1)) 

    curr = ScratchVar()

    return Seq(
        curr.store(Int(0)),
        idlist.store(App.localGet(addr, key)),
        For(init, iter, incr).Do(Seq(
            curr.store(ExtractUint64(idlist.load(), i.load()*Int(8))),

            If(curr.load()>asset_id)
            .Then(Seq(
                splice_in(asset_id, idlist, i.load()*Int(8)),
                i.store(Len(idlist.load()))
            ))
            .ElseIf(curr.load()==asset_id)
            .Then(Int(1)),
        )),
        App.localPut(addr, key, idlist.load()),
        Int(1)
    )

@Subroutine(TealType.uint64)
def remove_from_localstate(addr, key, asset_id):
    idlist = ScratchVar()
    i      = ScratchVar()

    init = i.store(Int(0))
    iter = i.load()<Len(idlist.load())/Int(8)
    incr = i.store(i.load() + Int(1)) 

    curr = ScratchVar()

    return Seq(
        curr.store(Int(0)),
        idlist.store(App.localGet(addr, key)),
        For(init, iter, incr).Do(Seq(
            curr.store(ExtractUint64(idlist.load(), i.load()*Int(8))),

            If(curr.load()==asset_id)
            .Then(Seq(
                splice_out(idlist, i.load()*Int(8)),
                i.store(Len(idlist.load()))
            ))
            .ElseIf(curr.load()>asset_id)
            .Then(Int(1)),
        )),
        App.localPut(addr, key, idlist.load()),
        Int(1)
    )


def splice_out(idlist, pos):
    return idlist.store(
        Concat(
            Substring(idlist.load(), Int(0), pos),
            Substring(idlist.load(), pos+Int(8), Len(idlist.load())-Int(8))
        )
    )

def splice_in(asset_id, idlist, pos):
    return idlist.store(
        Concat(
            Substring(idlist.load(), Int(0), pos),
            Itob(asset_id),
            Substring(idlist.load(), pos, Len(idlist.load()))
        )
    )
