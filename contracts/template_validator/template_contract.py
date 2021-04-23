import base64
import hashlib
from algosdk.logic import parse_uvarint, check_byte_const_block, check_int_const_block
from pyteal import *

dummy_string = "b64(bG9yZW0=)"
dummy_int = "b64(AAAAAAAAAHs=)"

class TemplateVar(object):
    start, length = 0, 0
    is_integer = False
    name = ""
    def __init__(self, is_integer, name):
        self.is_integer = is_integer
        self.name = name

class TemplateContract(object):
    template_source = ""
    teal_source     = ""
    assembled_bytes = [] 
    template_vars   = []
    client          = None

    def __init__(self, tmpl_path, client):
        self.tmpl_path = tmpl_path
        self.client = client

        with open(self.tmpl_path, mode='r') as f:
            self.template_bytes = f.read()

        teal_src = self.populate_tmpl_vars()

        result = client.compile(teal_src)
        self.assembled_bytes = base64.b64decode(result["result"])

        self.set_start_positions()

    def get_validate_ops(self, contract_val):

        blank_hash = self.get_blank_hash()

        blank_contract = ScratchVar(TealType.bytes)
        concat_ops     = [blank_contract.store(Bytes(""))]
        pos            = 0

        for idx in range(len(self.template_vars)):
            tv = self.template_vars[idx]
            concat_ops.append(blank_contract.store(
                Concat(blank_contract.load(), 
                    Substring(contract_val, Int(pos), Int(tv.start))))) 

            pos = tv.start + tv.length

            concat_ops.append(blank_contract.store(
                Concat(blank_contract.load(), 
                Substring(contract_val, Int(pos), Len(contract_val)))))

        concat_ops.append(Int(1))

        return And(
            # prepare the blank contract
            Seq(concat_ops), 
            # Make sure this is the contract being distributed to
            Sha256(blank_contract.load()) == Bytes(blank_hash),
        )

    def populate_tmpl_vars(self):
        teal_source = self.template_bytes
        lines = self.template_bytes.split("\n")
        # Iterate over lines 
        for l in range(len(lines)):
            line = lines[l]
            # Find strings starting with TMPL_
            if "TMPL_" in line:
                chunks = line.split(" ")
                if chunks[0] in ("pushbytes", "pushint"):
                    tv = TemplateVar(lines[l+1] == "btoi", chunks[1])
                    if tv.is_integer:
                        teal_source = teal_source.replace(chunks[1], dummy_int)
                    else:
                        teal_source = teal_source.replace(chunks[1], dummy_string)

                self.template_vars.append(tv)
        return teal_source

    def get_populated_hash(self, vals):
        teal = self.template_bytes
        for k,v in vals.items():
            teal = teal.replace(k, v)

        result = self.client.compile(teal)
        return result["hash"]

    def get_blank_hash(self):
        removed = 0 

        blanked = self.assembled_bytes
        for v in self.template_vars:
            blanked = blanked[:v.start-removed] + blanked[(v.start+v.length)-removed:]
            removed += v.length 

        h = hashlib.sha256(blanked)
        return base64.b64encode(h.digest()).decode('ascii')


    def set_start_positions(self):
        pos = 1 # Version byte

        if self.assembled_bytes[pos] == 0x20:
            pos += check_int_const_block(self.assembled_bytes, pos)

        if self.assembled_bytes[pos] == 0x26:
            pos += check_byte_const_block(self.assembled_bytes, pos)

        for var in self.template_vars:
            pos += 1 # pushbytes opcode byte 
            var.length = int(self.assembled_bytes[pos]) # Get length
            pos += 1 
            var.start = pos
            pos += var.length
            if var.is_integer:
                pos += 1 # btoi
            pos += 2 #store opcode + slot id byte
