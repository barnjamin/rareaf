from pyteal import *

from listing import listing

blank_contract_hash = Bytes("") # TODO:: Get hash of listing.teal after being blanked out

platform_token = Int(1)
platform_acct = Addr("UYNGBE3ZS4FVDAXPYPWJ7GQDEAELALTOS6RZTXWZ3PKVME5ZPBVQYS3NHA") 
platform_fee = Int(100)

def get_byte_positions(program):
    # Find the store commands, get the strpos of the 
    # variable on the line prior
    positions, position = [], 0
    lines = program.split("\n")
    for idx in range(len(lines)):
        if lines[idx][:5] == "store":
            l = len(lines[idx-1])
            positions.append((position - (l +1), l))
        position += len(lines[idx]) + 1
    return positions 

def main():
    acct, price, asa = get_byte_positions(compileTeal(listing(), Mode.Signature))

    blank_contract      = ScratchVar(TealType.bytes)
    pre_acct            = ScratchVar(TealType.bytes)
    pre_price           = ScratchVar(TealType.bytes)
    pre_asa             = ScratchVar(TealType.bytes)
    rest                = ScratchVar(TealType.bytes)
    populated_contract  = ScratchVar(TealType.bytes)

    contract_acct = ScratchVar(TealType.bytes)
    creator_acct = ScratchVar(TealType.bytes)

    price_val, asa_val = Btoi(Arg(0)), Btoi(Arg(1))

    prep_contract = Seq([
        contract_acct.store(Txn.asset_receiver()),
        creator_acct.store(Txn.asset_sender()),

        blank_contract.store(Txn.note()),

        #TODO: find a way to not have to reload blank contract every time
        pre_acct.store(Substring(blank_contract.load(), Int(0), Int(acct[0]))),
        pre_price.store(Substring(blank_contract.load(), Int(acct[1]), Int(price[0]))),
        pre_asa.store(Substring(blank_contract.load(), Int(price[1]), Int(asa[0]))),
        rest.store(Substring(blank_contract.load(), Int(asa[1]), Len(blank_contract.load()))),

        #TODO can concat work on the entire stack at once?
        populated_contract.store(
                        Concat(pre_acct.load(), Bytes("addr "), Txn.sender(), Bytes("\n"),
                            pre_price.load(), Bytes("int "), Itob(price_val), Bytes("\n"),
                            pre_asa.load(), Bytes("int "), Itob(asa_val), Bytes("\n"), rest.load())),
        Int(1)
    ])

    correct_behavior = And(
        prep_contract,
        # Make sure the contract template matches
        Sha256(blank_contract.load()) == blank_contract_hash,
        # Make sure this is the contract being distributed to 
        Sha512_256(populated_contract.load()) ==  Txn.receiver(),
    )

    asa_xfer = And(
        # Is safe asset transfer
        Gtxn[0].type_enum() == TxnType.AssetTransfer,
        Gtxn[0].rekey_to() == Global.zero_address(),
        Gtxn[0].asset_close_to() == Global.zero_address(),
        # is for asa token
        Gtxn[0].xfer_asset() == asa_val,
        # Is to contract, from creator 
        Gtxn[0].asset_receiver() == contract_acct.load(),
        Gtxn[0].asset_sender() == creator_acct.load(),
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
        Gtxn[1].config_asset_manager() == contract_acct.load(),
    )

    funding = And(
        # Is safe payment
        Gtxn[2].type_enum() == TxnType.Payment,
        Gtxn[2].rekey_to() == Global.zero_address(),
        Gtxn[2].close_remainder_to() == Global.zero_address(),
        # Is To Contract Acct 
        Gtxn[2].receiver() == contract_acct.load(),
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
        Gtxn[3].asset_receiver() == contract_acct.load(),
        Gtxn[3].asset_sender() == platform_acct,
        # is for 1 tokens
        Gtxn[3].asset_amount() == Int(1)
    )

    valid = And(
        Global.group_size() == Int(4),
        correct_behavior,
        asa_xfer,
        asa_config,
        funding,
        platform_xfer
    )

    return valid 

if __name__ == "__main__":
    print(compileTeal(main(), Mode.Signature))