from pyteal import *
from template_validator import template_contract
from listing import listing
from algosdk.logic import parse_uvarint
from algosdk.v2client import algod

token   = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
address = "http://localhost:4001"
client  = algod.AlgodClient(token,address)


platform_token = Int(7)
platform_acct = Addr("7LQ7U4SEYEVQ7P4KJVCHPJA5NSIFJTGIEXJ4V6MFS4SL5FMDW6MYHL2JXM") 
seed_amt = Int(int(5e6))

def main():

    tmpl_path = "./listing.teal.tmpl"
    tc = template_contract.TemplateContract(tmpl_path, client)

    # Get arg values
    asa_val, contract_val = Btoi(Arg(1)), Arg(2)

    correct_behavior = And(
        tc.get_validate_ops(contract_val),
       # Make sure the contract template matches
        Sha512_256(Concat(Bytes("Program"), contract_val)) ==  Txn.asset_receiver(),
    )

    # Validate transactions
    asa_xfer = And(
        # Is safe asset transfer
        Gtxn[0].type_enum() == TxnType.AssetTransfer,
        Gtxn[0].rekey_to() == Global.zero_address(),
        Gtxn[0].asset_close_to() == Global.zero_address(),
        # is for asa token
        Gtxn[0].xfer_asset() == asa_val,
        # is for 1 tokens
        Gtxn[0].asset_amount() == Int(1)
    )

    asa_config = And(
        # Is safe platform token close out, creator gets 5 and the rest goes back to platform
        Gtxn[1].type_enum() == TxnType.AssetConfig,
        Gtxn[1].rekey_to() == Global.zero_address(),
        Gtxn[1].asset_close_to() == Global.zero_address(),
        # is for asa token
        Gtxn[1].config_asset() == asa_val,
        # Is to creator, rest to platform account
        Gtxn[1].config_asset_manager() == Txn.asset_receiver(),
    )

    funding = And(
        # Is safe payment
        Gtxn[2].type_enum() == TxnType.Payment,
        Gtxn[2].rekey_to() == Global.zero_address(),
        Gtxn[2].close_remainder_to() == Global.zero_address(),
        # Is To Contract Acct 
        Gtxn[2].receiver() == Txn.asset_receiver(),
        # Is for some amt algo
        Gtxn[2].amount() ==  seed_amt 
    )

    platform_xfer = And(
        # Is safe asset transfer
        Gtxn[3].type_enum() == TxnType.AssetTransfer,
        Gtxn[3].rekey_to() == Global.zero_address(),
        Gtxn[3].asset_close_to() == Global.zero_address(),
        # is for platform token
        Gtxn[3].xfer_asset() == platform_token,
        # Is to contract, from  platform 
        Gtxn[3].asset_receiver() == Txn.asset_receiver(),
        Gtxn[3].sender() == platform_acct,
        # is for 1 tokens
        Gtxn[3].asset_amount() == Int(1)
    )

    return And(
        Global.group_size() == Int(4),
        correct_behavior,
        asa_xfer,
        asa_config,
        funding,
        platform_xfer
    )


def get_blank_hash(assembled_name, tmpl_vars):
    import base64
    import hashlib

    program_bytes = [] #Will be list of bytes
    with  open(assembled_name, mode='rb') as f:
        program_bytes = bytearray(f.read())

    removed = 0
    for v in tmpl_vars:
        program_bytes = program_bytes[:v.start-removed] + program_bytes[(v.start+v.length)-removed:]
        removed += v.length 

    h = hashlib.sha256(program_bytes)
    return base64.b64encode(h.digest()).decode('ascii')


def get_bytec_byte_positions(program, pc):
    size = 1
    bytearrays = []
    num_ints, bytes_used = parse_uvarint(program[pc + size:])
    if bytes_used <= 0:
        return 0,[]

    size += bytes_used
    for i in range(0, num_ints):
        if pc + size >= len(program):
            return 0,[]

        item_len, bytes_used = parse_uvarint(program[pc + size:])
        if bytes_used <= 0:
            return 0,[] 

        size += bytes_used
        if pc + size + item_len > len(program):
            return 0,[]

        bytearrays.append((program[pc+size:pc+size+item_len], pc+size, item_len+1))
        size += item_len
    return size, bytearrays

def get_intc_byte_positions(program, pc):
    size = 1
    ints = []
    num_ints, bytes_used = parse_uvarint(program[pc + size:])
    if bytes_used <= 0:
        return 0,[]
    size += bytes_used
    for i in range(0, num_ints):
        if pc + size >= len(program):
            return 0, []
        num, bytes_used = parse_uvarint(program[pc + size:])
        if bytes_used <= 0:
            return 0,[]
        ints.append((num, pc+size, bytes_used))
        size += bytes_used
    return size, ints

def set_start_positions(assembled_name, tmpl_vars):
    program_bytes = [] #Will be list of bytes
    with  open(assembled_name, mode='rb') as f:
        program_bytes = f.read()

    pos = 1 # Version byte

    size, _ = get_intc_byte_positions(program_bytes, pos)
    pos += size

    size, _ = get_bytec_byte_positions(program_bytes, pos)
    pos += size 

    for var in tmpl_vars:
        pos += 2 # pushbytes opcode byte + length of bytes byte
        var.start = pos
        pos += var.length
        if var.is_integer:
            pos += 1 # btoi
        pos += 3 #store opcode + int slot 

if __name__ == "__main__":
    print(compileTeal(main(), Mode.Signature, version=3))
