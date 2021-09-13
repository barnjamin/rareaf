import json
import uvarint
import sys

#goal clerk compile ../listing.tmpl.teal
#python tcv.py ../listing.tmpl.teal
#goal clerk compile -D listing.tmpl.teal.populated

def blank_contract(tc):
    contract = list(get_contract(tc+".populated"))
    details = get_details(tc+".tok.deets.json")

    # Make sure they're sorted into the order they appear in 
    # the contract or the `shift` will be wrong
    labels = dict(sorted(details['template_labels'].items(), key=lambda item: item[1]['position']))

    for k,v in labels.items():
        pos = v['position']
        if v['bytes']:
            val, l = uvarint.decode(contract[pos:])
            total = l + val
            print("{} set to {}".format(k,  contract[pos:pos+total]))
            contract[pos:pos+total] = [0]
        else:
            val, l = uvarint.decode(contract[pos:])
            total = l  
            print("{} set to {}".format(k,  val))
            contract[pos:pos+total] = [0]

    with open(tc+".blanked", "wb") as blanked_contract:
        blanked_contract.write(bytearray(contract))
        print("Wrote blanked contract to {}".format(tc+".blanked"))

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


if __name__ == "__main__":

    if len(sys.argv) != 2:
        print("Please supply the path to the template contract")
        sys.exit() 

    print("populating {}".format(sys.argv[1]))

    populate_contract(sys.argv[1], {
        "TMPL_APP_ID": 1231123,
        "TMPL_ASSET_ID": "0000000000000000",
        "TMPL_CREATOR_ADDR": "deadbeef",
        "TMPL_FEE_AMT": 1000000,
        "TMPL_OWNER_ADDR": "deadbeef",
        "TMPL_PRICE_ID": 5,
        "TMPL_SEED_AMT": 10000 
    })

    blank_contract(sys.argv[1])

    # check to make sure the argv[1].tok == argv[1].blanked