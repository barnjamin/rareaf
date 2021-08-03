import LogicSig from 'algosdk/dist/types/src/logicsig'
import {getAlgodClient} from './algorand'
import algosdk from 'algosdk'
import {addrToB64, concatTypedArrays} from './algorand'
import { platform_settings as ps, get_template_vars } from './platform-conf'
import {sha256} from 'js-sha256'


//@ts-ignore
import listing_var_positions from '../contracts/listing.tmpl.teal.json'
const listing_var_path = 'src/contracts/listing.tmpl.teal.json'

//@ts-ignore
import listing_template from '../contracts/listing.tmpl.teal'
const listing_template_path =  'src/contracts/listing.tmpl.teal'

//@ts-ignore
import platform_approval_template from '../contracts/platform-approval.tmpl.teal'
const platform_approval_path = 'src/contracts/platform-approval.tmpl.teal'

//@ts-ignore
import platform_clear_template from '../contracts/platform-clear.tmpl.teal'
const platform_clear_path = 'src/contracts/platform-clear.tmpl.teal'

//@ts-ignore
import platform_owner_template from '../contracts/platform-owner.tmpl.teal'
const platform_owner_path = 'src/contracts/platform-owner.tmpl.teal'

import fetch from 'node-fetch'

export const dummy_addr = "b64(YWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWE=)"
export const dummy_id = "b64(AAAAAAAAAHs=)"

export async function get_listing_sig(vars: any): Promise<LogicSig> {
    const compiled_program = await get_listing_compiled(vars)
    const program_bytes = new Uint8Array(Buffer.from(compiled_program.result, "base64"));
    return algosdk.makeLogicSig(program_bytes);
}

export async function get_platform_owner(vars: any): Promise<LogicSig> {
    const path = platform_owner_template?platform_owner_template:platform_owner_path;
    const program = await get_contract_compiled(path, vars)
    const program_bytes = new Uint8Array(Buffer.from(program.result, "base64"));
    return algosdk.makeLogicSig(program_bytes);
}

export async function get_listing_hash(vars: any): Promise<Buffer> {
    const path = listing_var_positions?listing_var_positions:listing_var_path
    const compiled = await get_listing_compiled(vars)
    return get_hash(new Uint8Array(Buffer.from(compiled.result, "base64")), path)
}

export async function get_listing_compiled(vars: any) {
    const path = listing_template?listing_template:listing_template_path
    return get_contract_compiled(path, get_template_vars(vars))
}

export async function get_contract_compiled(template: string, vars: any) {
    const client = getAlgodClient()
    const populated = await populate_contract(template, vars)
    return client.compile(populated).do()
}

export async function get_approval_program(vars: any){
    const path = platform_approval_template?platform_approval_template:platform_approval_path
    const compiled =  await get_contract_compiled(path, get_template_vars(vars))
    return new Uint8Array(Buffer.from(compiled.result, "base64"))
}

export async function get_clear_program(vars: any){
    const path = platform_clear_template?platform_clear_template:platform_clear_path
    const compiled =  await get_contract_compiled(path, vars)
    return new Uint8Array(Buffer.from(compiled.result, "base64"))
}

export async function populate_contract(template: string, vars: any) {
    //Read the program, Swap vars, spit out the filled out tmplate
    let program = await get_file(template)
    for (let v in vars) {
        let val = vars[v]
        if(val === ""){
            val = dummy_addr 
        }

        program = program.replace(new RegExp(v, "g"), val)
    }
    return program
}

export async function get_hash(program_bytes: Uint8Array, listing_vars: any): Promise<Buffer> {
    let removed = 0 
    let blanked = program_bytes
    for(let i in listing_vars){
        const v      = listing_vars[i]
        const before = blanked.slice(0, v.start - removed)
        const after  = blanked.slice((v.start+v.length)-removed)

        blanked = concatTypedArrays(before, after)
        removed += v.length
    }

    const hash = sha256.create();
    hash.update(blanked);
    return Buffer.from(hash.hex(), 'hex');
}

export async function get_file(program) {
    if(program.slice(0,13) == "src/contracts"){
        const fs = require('fs')
        const resolve = require('path').resolve
        return  fs.readFileSync(resolve(program), "utf8")
    }

    return await fetch(program)
        .then(response => checkStatus(response) && response.arrayBuffer())
        .then(buffer => {
            const td = new TextDecoder()
            return td.decode(buffer)
        }).catch(err => {
            console.error(err)
            return ""
        });
}

function checkStatus(response) {
    if (!response.ok) throw new Error(`HTTP ${response.status} - ${response.statusText}`);
    return response;
}