import { Position, Toaster } from "@blueprintjs/core";
 
export const InfoToaster = Toaster.create({
    className: "info-toaster",
    position: Position.TOP,
    maxToasts: 5,
});

export function showInfo(info: string){
    InfoToaster.show({
        message:info,
        icon:"info-sign"
    })
}

export const NetworkToaster = Toaster.create({
    className: "network-toaster",
    position: Position.BOTTOM_LEFT,
    maxToasts: 5,
});

export function showNetworkWaiting(txId: string) {
    NetworkToaster.show({
        intent:"primary", 
        message:"Transaction Sent: " + txId,
        icon:"cloud-upload"       
    })
}

export function showNetworkSuccess(txId: string) {
    NetworkToaster.show({
        intent:"success", 
        message:"Transaction Success: " + txId,
        icon:"tick"       
    })
}

export function showNetworkError(txId: string, message: string) {
    NetworkToaster.show({
        intent:"danger", 
        message:"Transaction Failed: " + txId + ", " + message,
        icon:"error"       
    })
}


export const ErrorToaster = Toaster.create({
    className: "error-toaster",
    position: Position.TOP,
    maxToasts: 5,
});

export function showErrorToaster(message: string) {
    ErrorToaster.show({
        intent:"danger", 
        message: message,
        icon:"error"       
    })
}