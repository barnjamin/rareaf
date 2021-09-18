import json
from pyteal.ast import scratch
import uvarint
import sys

from pyteal import ScratchVar, For, TealType, Int, Seq, Concat, Substring,  Assert
from pyteal import Subroutine, Btoi, Bytes, Sha256, If, GetByte, Or, And, Return

# goal clerk compile ../listing.tmpl.teal
# python tcv.py ../listing.tmpl.teal
# goal clerk compile -D listing.tmpl.teal.populated
# diff ../listing.tmpl.teal.tok ../listing.tmpl.teal.blanked

def get_validate_subroutine(tc):
    details = get_details(tc+".map.json")

    # Create a bytestring of 8 byte integer values for the position of 
    # Each template variable, can be retrieved with get_int_from_list
    positions = b""
    isBytes = b""
    for _,v in details.items():
        positions += (v['position']).to_bytes(8,'big')
        isBytes += (int(v['bytes'])).to_bytes(8, 'big')
    
    @Subroutine(TealType.uint64)
    def validate(txn, hash):
        blanked = ScratchVar(TealType.Bytes)
        lastpos = ScratchVar()
        nextpos = ScratchVar()

        pos_list = Bytes(positions)
        type_list = Bytes(isBytes)

        x = ScratchVar()
        init = Seq(
            x.store(0),
            blanked.store(Bytes("")),
            lastpos.store(0),
            nextpos.store(0)
        )

        cond = x.load()<len(details.items())
        iter = x.store(x.load() + Int(1))

        return Seq(
            For(init, cond, iter).Do(
                Seq(
                    #Take the last pos to the next pos
                    nextpos.store(get_int_from_list(pos_list, x.load()+Int(1))),
                    Concat(
                        blanked.load(),
                        Substring(txn.ApplicationArgs[0], lastpos.load(), nextpos.load())
                    ),
                    lastpos.store(nextpos.load() + get_length(txn.ApplicationArgs[0], nextpos.load(), get_int_from_list(type_list, x.load()+Int(1)))),
                )
            ),
            Sha256(blanked.load()) == hash
        )

    return validate


#def parse_uvarint(buf):
#    return

@Subroutine(TealType.uint64)
def get_length(s, pos, isbyte):
    return If(isbyte, 
       read_uvarint(Substring(s, pos, pos+Int(10))),
       read_uvarint_length(Substring(s, pos, pos+Int(10)))
    )

@Subroutine(TealType.uint64)
def read_uvarint(buf):
    x = ScratchVar()
    s = ScratchVar()
    i = ScratchVar()
    b = ScratchVar()

    init = Seq(
        x.store(0),
        s.store(0),
        i.store(0),
        b.store(0)
    )
    cond = i.load()<=Int(9)
    iter = i.store(i.load() + Int(1))

    return Seq(
        For(init, cond, iter).Do(
            Seq(
                b.store(GetByte(buf, i.load())),
                If(b.load()<Int(128),
                    If( Or( i.load()>Int(9), And(i.load==Int(9), b.load()>Int(1)) ), Assert(0)), #Failed to parse?
                    Return(x.load() | (b.load() << s.load()))
                ),
                x.store(x.load() | ((b.load() & Int(127)) << s.load())),
                s.store(s.load() + Int(7))
            )
        ),
        x.load()
    )
    

@Subroutine(TealType.uint64)
def read_uvarint_length():
    return Int(0)

# Takes a bytestring of 8 byte uint64 and treats it as an array, 
# converting the idx to a position in the byteslice and returning
# the integer value of the 8 byte substring
@Subroutine(TealType.uint64)
def get_int_from_list(arr, idx):
    return  Btoi(Substring(arr, idx * Int(8), ((idx + Int(1)) * Int(8))))


# blank_contract takes a path to a template contract and writes out a 
# version with the populated template variables replaced with 0s
# it assumes the populated version will be in the same dir with .populated suffix
# it also assumes the .map.json will be there with the template variable details
def blank_contract(tc):
    contract = list(get_contract(tc+".populated"))
    details = get_details(tc+"map.json")

    found = {}
    for k,v in details.items():
        pos = v['position']
        if v['bytes']:
            val, l = uvarint.decode(contract[pos:])
            total = l + val
            found[k] = bytearray(contract[pos+l:pos+total]).hex()
            contract[pos:pos+total] = [0]
        else:
            val, l = uvarint.decode(contract[pos:])
            total = l  
            found[k] = val  
            contract[pos:pos+total] = [0]

    with open(tc+".blanked", "wb") as blanked_contract:
        blanked_contract.write(bytearray(contract))
        print("Wrote blanked contract to {}".format(tc+".blanked"))

    return found


# populate_contract takes a path to a template contract and set of named vars
# and inserts them into the contract bytecode, taking care to set appropriate length
# fields and adjusting the positions for the difference in lengths accrued
# it assumes the compiled bytecode is in the same directory with a `.tok` suffix
# it also assumes the template variable details are present in the same dir with `.map.json` suffix
def populate_contract(tc, tvars):
    contract = list(get_contract(tc+".tok"))
    details = get_details(tc+".map.json")


    shift = 0
    for k, v in details.items():
        if k in tvars:
            pos = v['position'] + shift
            if v['bytes']:
                val = bytes.fromhex(tvars[k])
                lbyte = uvarint.encode(len(val))
                # -1 to account for the existing 00 byte for length
                shift += (len(lbyte)-1) + len(val)
                # +1 to overwrite the existing 00 byte for length
                contract[pos:pos+1] = lbyte + val

            else:
                val = uvarint.encode(tvars[k])
                # -1 to account for existing 00 byte
                shift += len(val) - 1
                #+1 to overwrite existing 00 byte
                contract[pos:pos+1] = val

    with open(tc+".populated", "wb") as populated_contract:
        populated_contract.write(bytearray(contract))
        print("Wrote populted contract to {}".format(tc+".populated"))

def get_contract(fname):
    contract = None
    with open(fname, 'rb') as f:
        contract = f.read()
    return contract


def get_details(fname):
    details = None
    with open(fname, 'r') as f:
        details = json.load(f)

    # Make sure they're sorted into the order they appear in 
    # the contract or the `shift` will be wrong
    return dict(sorted(details['template_labels'].items(), key=lambda item: item[1]['position']))


def check_match(fname):
    original = None
    blanked = None
    with open(fname+".tok", "rb") as f:
        original = f.read()
    with open(fname+".blanked", "rb") as f:
        blanked = f.read()

    return original == blanked

if __name__ == "__main__":

    if len(sys.argv) != 2:
        print("Please supply the path to the template contract")
        sys.exit() 

    print("populating {}".format(sys.argv[1]))

    vars = {
        "TMPL_APP_ID": 1231123,
        "TMPL_ASSET_ID": "0000000000000000",
        "TMPL_CREATOR_ADDR": "deadbeef",
        "TMPL_FEE_AMT": 1000000,
        "TMPL_OWNER_ADDR": "deadbeef",
        "TMPL_PRICE_ID": 5,
        "TMPL_SEED_AMT": 10000 
    }

    populate_contract(sys.argv[1], vars)

    found_vars = blank_contract(sys.argv[1])

    for k,v in vars.items():
        print("{} match? {}".format(k, v == found_vars[k]))


    print("Blanked Match original?: {}".format(check_match(sys.argv[1])))


    # check to make sure the argv[1].tok == argv[1].blanked