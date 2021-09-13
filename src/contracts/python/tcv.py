import json
import uvarint
import sys

# goal clerk compile ../listing.tmpl.teal
# python tcv.py ../listing.tmpl.teal
# goal clerk compile -D listing.tmpl.teal.populated
# diff ../listing.tmpl.teal.tok ../listing.tmpl.teal.blanked


# blank_contract takes a path to a template contract and writes out a 
# version with the populated template variables replaced with 0s
# it assumes the populated version will be in the same dir with .populated suffix
# it also assumes the .tok.deets.json will be there with the template variable details
def blank_contract(tc):
    contract = list(get_contract(tc+".populated"))
    details = get_details(tc+".tok.deets.json")

    # Make sure they're sorted into the order they appear in 
    # the contract or the positions will get weird
    labels = dict(sorted(details['template_labels'].items(), key=lambda item: item[1]['position']))

    found = {}
    for k,v in labels.items():
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
# it also assumes the template variable details are present in the same dir with `.tok.deets.json` suffix
def populate_contract(tc, tvars):
    contract = list(get_contract(tc+".tok"))
    details = get_details(tc+".tok.deets.json")

    # Make sure they're sorted into the order they appear in 
    # the contract or the `shift` will be wrong
    labels = dict(sorted(details['template_labels'].items(), key=lambda item: item[1]['position']))

    shift = 0
    for k, v in labels.items():
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
    return details


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