import {getAlgodClient} from './algorand'
import algosdk, {LogicSigAccount} from 'algosdk'
import {addrToB64, concatTypedArrays} from './algorand'
import { platform_settings as ps, get_template_vars } from './platform-conf'
import {sha256} from 'js-sha256'

//@ts-ignore
import listing_var_positions from '../contracts/listing.tmpl.teal.json'
//@ts-ignore
import listing_template from '../contracts/listing.tmpl.teal'


//@ts-ignore
import platform_approval_template from '../contracts/platform-approval.tmpl.teal'
//@ts-ignore
import platform_clear_template from '../contracts/platform-clear.tmpl.teal'

//@ts-ignore
import platform_owner_template from '../contracts/platform-owner.tmpl.teal'


export const dummy_addr = "b64(YWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWE=)"
export const dummy_id = "b64(AAAAAAAAAHs=)"

export async function get_listing_sig(vars: any): Promise<LogicSigAccount> {
    const compiled_program = await get_listing_compiled(vars)
    const program_bytes = new Uint8Array(Buffer.from(compiled_program.result, "base64"));
    return new LogicSigAccount(program_bytes);
}

export async function get_platform_owner(vars: any): Promise<LogicSigAccount> {
    const program       = await get_contract_compiled(platform_owner_template, vars)
    const program_bytes = new Uint8Array(Buffer.from(program.result, "base64"));
    return new LogicSigAccount(program_bytes);
}

export async function get_listing_hash(vars: any): Promise<Buffer> {
    const compiled = await get_listing_compiled(vars)
    return get_hash(new Uint8Array(Buffer.from(compiled.result, "base64")), listing_var_positions)
}

export async function get_listing_compiled(vars: any) {
    return get_contract_compiled(listing_template, get_template_vars(vars))
}

export async function get_contract_compiled(template: string, vars: any) {
    const client = getAlgodClient()
    const populated = await populate_contract(template, vars)
    return client.compile(populated).do()
}

export async function get_approval_program(vars: any){
    const compiled =  await get_contract_compiled(platform_approval_template, get_template_vars(vars))
    return new Uint8Array(Buffer.from(compiled.result, "base64"))
}

export async function get_clear_program(vars: any){
    const compiled =  await get_contract_compiled(platform_clear_template, vars)
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

export function extract_vars(teal){
    let vars = {}
    for(let vname in listing_var_positions){
        const v = listing_var_positions[vname]
        vars[vname] = teal.subarray(v.start, v.start+v.length)
    }
    return vars
}

function checkStatus(response) {
    if (!response.ok) throw new Error(`HTTP ${response.status} - ${response.statusText}`);
    return response;
}