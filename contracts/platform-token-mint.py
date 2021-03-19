from pyteal import *

from listing import listing

blank_acct = Global.zero_address()
blank_contract_hash = Bytes("") # Get hash of listing.teal after being blanked out
max_int_length = 10

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
    # TODO: Get these from note? as args? 
    price_val, asa_val = Bytes("0"),Bytes("0")

    acct, price, asa = get_byte_positions(compileTeal(listing(), Mode.Signature))

    blank_contract = Txn.note()

    pre_acct    = Substring(blank_contract, Int(0), Int(acct[0]))
    pre_price   = Substring(blank_contract, Int(acct[1]), Int(price[0]))
    pre_asa     = Substring(blank_contract, Int(price[1]), Int(asa[0])) 
    rest        = Substring(blank_contract, Int(asa[1]), Len(blank_contract))

    contract = Concat(pre_acct, Bytes("addr "), Txn.sender(), Bytes("\n"))
    contract = Concat(contract, pre_price, Bytes("int "), price_val, Bytes("\n"))
    contract = Concat(contract, pre_asa, Bytes("int "), asa_val, Bytes("\n"))
    contract = Concat(contract, rest)

    correct_behavior = And(
        # Make sure the contract template matches
        Sha256(blank_contract) == blank_contract_hash,
        # Make sure this is the contract being distributed to 
        Sha512_256(contract) ==  Txn.receiver()
    )


    #TODO: check that there are the following grouped transactions
    #   - an asa xfer that matches the asset id
    #   - an asa config change to make manager the contract account
    #   - a funding tx to cover cost of other transactions and fee
    #   - a platform token xfer for listing the contract



    return correct_behavior

if __name__ == "__main__":
    print(compileTeal(main(), Mode.Signature))