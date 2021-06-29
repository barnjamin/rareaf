import LogicSig from 'algosdk/dist/types/src/logicsig'
import {getAlgodClient} from './algorand'
import algosdk from 'algosdk'
import {concatTypedArrays} from './algorand'

import {sha256} from 'js-sha256'

//@ts-ignore
import listing_var_positions from 'url:../contracts/listing.tmpl.teal.json'
//@ts-ignore
import listing_template from 'url:../contracts/listing.tmpl.teal'


//@ts-ignore
import platform_approval_template from 'url:../contracts/platform-approval.tmpl.teal'

//@ts-ignore
import platform_approval from 'url:../contracts/platform-approval.teal'
//@ts-ignore
import platform_clear from 'url:../contracts/platform-clear.teal'

//@ts-ignore
import platform_delegate_signed from 'url:../contracts/platform.signed'
//@ts-ignore
//import platform_delegate from 'url:../contract/platform-delegate.teal'


export async function get_listing_sig(vars: any): Promise<LogicSig> {
    const compiled_program = await get_contract_compiled(listing_template, vars)
    const program_bytes = new Uint8Array(Buffer.from(compiled_program.result, "base64"));
    return algosdk.makeLogicSig(program_bytes);
}

export async function get_platform_sig(): Promise<LogicSig> {
    const compiled_bytes        = await get_signed_platform_bytes()
    const delegate_program_bytes= new Uint8Array(Buffer.from(compiled_bytes, "base64"));
    return algosdk.logicSigFromByte(delegate_program_bytes)
}

export async function get_listing_compiled(vars: any) {
    return get_contract_compiled(listing_template, vars)
}

export async function get_contract_compiled(template: string, vars: any) {
    const client = getAlgodClient()
    const populated = await populate_contract(template, vars)
    return  client.compile(populated).do()
}

export async function get_approval_program_template(vars: any){
    const compiled =  await get_contract_compiled(platform_approval_template, vars)
    return new Uint8Array(Buffer.from(compiled.result, "base64"))
}

export async function get_approval_program(vars: any){
    const compiled =  await get_contract_compiled(platform_approval, vars)
    return new Uint8Array(Buffer.from(compiled.result, "base64"))
}

export async function get_clear_program(vars: any){
    const compiled =  await get_contract_compiled(platform_clear, vars)
    return new Uint8Array(Buffer.from(compiled.result, "base64"))
}

export async function get_signed_platform_bytes(){
    return await get_file(platform_delegate_signed)
}

export async function populate_contract(template: string, vars: any) {
    //Read the program, Swap vars, spit out the filled out tmplate
    let program = await get_file(template)
    for (let v in vars) {
        program = program.replace(v, vars[v])
    }
    return program
}
export async function get_listing_hash(vars: any): Promise<Buffer> {
    return get_hash(listing_template, vars)
}

export async function get_hash(template: string, vars: any): Promise<Buffer> {
    const listing_vars = JSON.parse(await get_file(listing_var_positions))
    const compiled_program = await get_contract_compiled(template, vars)
    const program_bytes = new Uint8Array(Buffer.from(compiled_program.result, "base64"));

    let removed = 0 
    let blanked = program_bytes
    for(let i in listing_vars){
        const v = listing_vars[i]
        console.log(v)

        blanked = concatTypedArrays(blanked.slice(0, v.start - removed) , blanked.slice((v.start+v.length)-removed))
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