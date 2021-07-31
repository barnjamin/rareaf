import base64
import hashlib
from algosdk.logic import check_byte_const_block, check_int_const_block
from pyteal import ScratchVar, TealType, Substring, Len, Sha256
from utils import *

from algosdk.v2client import algod
import json

dummy_string_bytes = "b64(YWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWE=)"
dummy_int_bytes = "b64(AAAAAAAAAHs=)"
dummy_int = "0"

class TemplateVar(object):
    start, length = 0, 0
    is_integer = False
    distance = 0
    name = ""
    def __init__(self, is_integer, name):
        self.is_integer = is_integer
        self.name = name

class TemplateContract(object):
    assembled_bytes = [] 
    template_vars   = []
    client          = None
    config          = {}

    def __init__(self, config):

        self.config = config

        with open(tealpath(config['contracts']['listing']), mode='r') as f:
            self.template_bytes = f.read()

        url         = "{}:{}".format(config['algod']['server'], config['algod']['port'])
        if config['algod']['port'] == 0:
            url = config['algod']['server']

        self.client = algod.AlgodClient(config['algod']['token'], url,  headers={'User-Agent': 'DoYouLoveMe?'})

        result = self.client.compile(self.populate_tmpl_vars())


        self.assembled_bytes = base64.b64decode(result["result"])

        self.set_start_positions()


    def write_tmpl_positions(self):
        with open("../"+self.config['contracts']['listing-positions'], 'w') as f:
            json.dump(self.get_positions_obj(), f)

    def get_positions_obj(self):
        pos = {}
        for tv in self.template_vars:
            pos[tv.name] = {'start':tv.start, 'length': tv.length, 'distance':tv.distance}
        return pos

    def get_validate_ops(self, contract_val):

        blank_contract = ScratchVar(TealType.bytes)
        pos            = ScratchVar(TealType.uint64)

        concat_ops     = [blank_contract.store(Bytes("")), pos.store(Int(0))]

        p = 0
        for idx in range(len(self.template_vars)):
            tv = self.template_vars[idx]
            concat_ops.append(blank_contract.store(
                Concat(blank_contract.load(), 
                    Substring(contract_val, pos.load(), pos.load() + Int(tv.distance)))))
            
            p += tv.length + tv.distance
            concat_ops.append(pos.store(pos.load() + Int(tv.length) + Int(tv.distance)))

        concat_ops.append(blank_contract.store(
            Concat(blank_contract.load(), 
            Substring(contract_val, pos.load(), Len(contract_val)))))

        concat_ops.append(Int(1))
        return And(
            # prepare the blank contract
            Seq(concat_ops), 
            # Make sure this is the contract being distributed to
            Sha256(blank_contract.load()) == Tmpl.Bytes("TMPL_BLANK_HASH"),
        )

    def populate_tmpl_vars(self):
        teal_source = self.template_bytes
        lines = self.template_bytes.split("\n")

        intc_line = lines[1]
        for intc in intc_line.split(" "):
            if "TMPL_" in intc:
                vname = intc[5:].lower()
                if vname in self.config['application']:
                    teal_source = teal_source.replace(intc, str(self.config['application'][vname]))
                else:
                    teal_source = teal_source.replace(intc, dummy_int)

        bytec_line = lines[2]
        for bytec in bytec_line.split(" "):
            if "TMPL_" in bytec:
                vname = bytec[5:].lower()
                #if vname in self.config['application']:
                #    teal_source = teal_source.replace(bytec, self.config['application'][vname])
                #else:
                teal_source = teal_source.replace(bytec, dummy_string_bytes)

        # Iterate over lines skipping consts
        for l in range(3, len(lines)):
            line = lines[l]

            # Find strings starting with TMPL_
            if "TMPL_" in line:
                chunks = line.split(" ")

                vname = chunks[1][5:].lower()
                if vname in self.config['application']:
                    teal_source= teal_source.replace(chunks[1], str(self.config['application'][vname]))
                    continue

                if chunks[0] not in ("pushbytes", "pushint"):
                    continue

                tv = TemplateVar(lines[l+1] == "btoi" or chunks[0] == "pushint", chunks[1])

                if tv.is_integer:
                    if chunks[0] == "pushbytes":
                        teal_source = teal_source.replace(chunks[1], dummy_int_bytes)
                    else:
                        teal_source = teal_source.replace(chunks[1], dummy_int)
                else:
                    teal_source = teal_source.replace(chunks[1], dummy_string_bytes)

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

        for vidx in range(len(self.template_vars)):
            var = self.template_vars[vidx]

            pos += 1 # pushbytes opcode byte 
            var.length = int(self.assembled_bytes[pos]) # Get length byte
            pos += 1  # length opcode byte
            var.start = pos 

            if vidx == 0:
                var.distance = pos
            else:
                pre = self.template_vars[vidx-1]
                var.distance = pos - (pre.start + pre.length)

            pos += var.length

            if var.is_integer:
                pos += 1 # btoi

            pos += 2 #store opcode + slot id byte
