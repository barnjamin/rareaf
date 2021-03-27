from pyteal import *
from listing import listing
from algosdk.logic import parse_uvarint

platform_token = Int(1)
platform_acct = Addr("NFMVG5PCLPEWGL5ACNHYEZOIUHXJBUW4SI754W6APBCCRUVVJKRQOAFAE4") 
platform_fee = Int(100)

def main():

    acct, price, asa = get_byte_positions('listing.teal.tok')
    blank_contract_hash = Bytes('base64', get_blank_hash('listing.teal.tok', acct, price, asa))

    blank_contract      = ScratchVar(TealType.bytes)

    pre_ints            = ScratchVar(TealType.bytes)
    post_ints           = ScratchVar(TealType.bytes)
    rest                = ScratchVar(TealType.bytes)

    populated_contract  = ScratchVar(TealType.bytes)

    asa_val, contract_val = Btoi(Arg(1)), Arg(2)
    intc_start = Int(price[1]) # version, intcblock, number of ints
    bytec_start = Int(acct[1] - (price[2] + asa[2]))
    addr_len = Int(32)

    prep_contract = Seq([
        populated_contract.store(contract_val),

        # Cut out the variables, this assumes the 2 vars are adjacent in the assembly
        pre_ints.store(Substring(populated_contract.load(), Int(0), intc_start)), 
        post_ints.store(Substring(populated_contract.load(), intc_start + Len(Arg(0))+Len(Arg(1)), bytec_start + Len(Arg(0))+Len(Arg(1)))),
        rest.store(Substring(populated_contract.load(), bytec_start + Len(Arg(0))+Len(Arg(1)) + addr_len, Len(populated_contract.load()))),

        blank_contract.store(Concat(pre_ints.load(), post_ints.load(), rest.load())),
        Int(1)
    ])

    #correct_behavior = And(
    #    # Make sure this is the contract being distributed to 
            #Sha256(blank_contract.load()) == blank_contract_hash,
        # Make sure the contract template matches
    #    Sha512_256(populated_contract.load()) ==  Txn.asset_receiver(),
    #)
    #correct_behavior = Sha512_256(Concat(Bytes("Program"), populated_contract.load())) ==  Txn.asset_receiver()
    correct_behavior = Sha256(blank_contract.load()) == blank_contract_hash

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
        Gtxn[2].amount() ==  Int(int(1e9))
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
        #Gtxn[3].asset_sender() == platform_acct,
        # is for 1 tokens
        Gtxn[3].asset_amount() == Int(1)
    )

    valid = And(
        Global.group_size() == Int(4),
        prep_contract,
        correct_behavior,
        asa_xfer,
        asa_config,
        funding,
        platform_xfer
    )

    return valid 


def get_blank_hash(assembled_name, *args):
    import base64
    import hashlib

    program_bytes = [] #Will be list of bytes
    with  open(assembled_name, mode='rb') as f:
        program_bytes = f.read()

    for arg in args:
        program_bytes = program_bytes[:arg[1]] + program_bytes[arg[1]+arg[2]:]

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

        bytearrays.append((program[pc+size:pc+size+item_len], pc+size, item_len))
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
        ints.append((num, size, bytes_used))
        size += bytes_used
    return size, ints

def get_byte_positions(assembled_name):
    program_bytes = [] #Will be list of bytes
    with  open(assembled_name, mode='rb') as f:
        program_bytes = f.read()

    pos = 1 # Version byte
    size, intc = get_intc_byte_positions(program_bytes, pos)
    pos += size
    size, bytec = get_bytec_byte_positions(program_bytes, pos)

    return [bytec[0], intc[0], intc[1]]

if __name__ == "__main__":
    print(compileTeal(main(), Mode.Signature))
    #main()