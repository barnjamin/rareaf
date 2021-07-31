import algosdk from 'algosdk'  
import { platform_settings as ps } from './platform-conf'

export function get_asa_cfg_txn(suggestedParams, from, asset, new_config) {
    return  {
        from: from,
        assetIndex: asset,
        type: 'acfg',
        ...new_config,
        ...suggestedParams
    }
}

export function get_cosign_txn(suggestedParams, from) {
    return {
        from: from,
        to: from,
        type: 'pay',
        amount: 0,
        ...suggestedParams,
        fee:suggestedParams.fee * 2
    }
}

export function get_pay_txn(suggestedParams, from, to, amount) {
    return {
        from: from,
        to: to,
        type: 'pay',
        amount: amount,
        ...suggestedParams
    }
}

export function get_asa_optin_txn(suggestedParams, addr, id) {
    return get_asa_xfer_txn(suggestedParams, addr, addr, id, 0)
}

export function get_asa_xfer_txn(suggestedParams, from, to, id, amt) {
    return {
        from: from,
        to: to,
        assetIndex: id,
        type: 'axfer',
        amount: amt,
        ...suggestedParams
    }
}

export function get_asa_create_txn(suggestedParams, addr, url) {
    return  {
        from: addr,
        assetURL: url,
        assetManager: addr,
        assetReserve: addr,
        assetClawback: addr,
        assetFreeze: addr,
        assetTotal: 1,
        assetDecimals: 0,
        type: 'acfg',
        ...suggestedParams
    }
}

export function get_asa_destroy_txn(suggestedParams, addr, token_id) {
    return {
        from: addr, 
        assetIndex: token_id, 
        type: 'acfg' ,
        ...suggestedParams
    }
}

export function get_app_optin_txn(suggestedParams, addr, id) {
    return {
        from: addr,
        appIndex:id,
        type: 'appl',
        appOnComplete: algosdk.OnApplicationComplete.OptInOC,
        ...suggestedParams
    }
}

export function get_app_create_txn(suggestedParams, addr, approval, clear) {
   return {
        from:addr,
        type:'appl',
        appLocalByteSlices: 16,
        appApprovalProgram: approval,
        appClearProgram: clear,
        ...suggestedParams
   } 
}

export function get_app_update_txn(suggestedParams, addr, approval, clear, id) {
   return {
        from:addr,
        appIndex: id,
        type:'appl',
        numLocalByteSlices: 16,
        appOnComplete: algosdk.OnApplicationComplete.UpdateApplicationOC,
        appApprovalProgram: approval,
        appClearProgram: clear,
        ...suggestedParams
   } 
}

export function get_app_destroy_txn(suggestedParams, addr, id) {
   return {
        from:addr,
        appIndex: id,
        type:'appl',
        appOnComplete: algosdk.OnApplicationComplete.DeleteApplicationOC,
        ...suggestedParams
   } 
}

export function get_app_call_txn(suggestedParams, addr, args) {
    return {
        from: addr,
        appArgs:args.map((a)=>{ return new Uint8Array(Buffer.from(a, 'base64'))}),
        appIndex:ps.application.app_id,
        appOnComplete: algosdk.OnApplicationComplete.NoOpOC,
        type:"appl",
        ...suggestedParams
    }
}
