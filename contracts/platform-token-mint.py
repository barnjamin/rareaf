from pyteal import *

blank_acct = Global.ZeroAddress 
blank_contract_hash = Bytes("") # Get hash of listing.teal after being blanked out
max_int_length = 10

def main():
    contract = Bytes(Txn.note())

    pre_acct = Substring(contract, Int(0), Int(acct_pos))
    post_acct = Substring(contract, Int(acct_pos+len(Txn.sender()))) 
    blanked_contract = Concat(pre_acct, blank_acct, post_acct)

    pre_price = Substring(blanked_contract, Int(0), Int(price_pos))
    post_price = Substring(blanked_contract, Int(price_pos+max_int_length)) 
    blanked_ contract = Concat(pre_price, blank_price, post_price)
    
    pre_asa = Substring(blanked_contract, Int(0), Int(asa_pos))
    post_asa = Substring(blanked_contract, Int(asa_pos+max_int_length)) 
    blanked_contract = Concat(pre_asa, blank_asa, post_asa)

    valid = And(
        # Make sure the contract template matches
        Sha256(blanked_contract) == blank_contract_hash,
        # Make sure this is the contract being distributed to 
        Sha512_256(contract) ==  Txn.receiver()
    )



if __name__ == "__main__":
    print(compileTeal(main(), Mode.Signature))