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
    acct, price, asa = get_byte_positions(compileTeal(listing(), Mode.Signature))

    blank_contract = Bytes(Txn.note())

    pre_acct    = Substring(blank_contract, Int(0), Int(acct[0]))
    pre_price   = Substring(blank_contract, Int(acct[1]), Int(price[0]))
    pre_asa     = Substring(blank_contract, Int(price[1]), Int(asa[0])) 
    rest        = Substring(blank_contract, Int(asa[1]))

    contract = Concat(pre_acct, "addr ", Txn.sender(), "\n")
    contract = Concat(contract, pre_price, "int ", price, "\n")
    contract = Concat(contract, pre_asa, "int ", asa, "\n")
    contract = Concat(contract, rest)

    valid = And(
        # Make sure the contract template matches
        Sha256(blanked_contract) == blank_contract_hash,
        # Make sure this is the contract being distributed to 
        Sha512_256(contract) ==  Txn.receiver()
    )

    return valid

if __name__ == "__main__":
    print(compileTeal(main(), Mode.Signature))