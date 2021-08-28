import { tokenToString } from "typescript";
import { getToken } from "./algorand";
import { ApplicationConfiguration } from "./application-configuration";


export type ASADetails = {
    id: number
    units: number
    decimals: number

    name: string
    unitName: string

    url: string

    icon: string
}

export class PriceToken {

    id: number;

    asa: ASADetails;

    constructor(ac: ApplicationConfiguration, name: string, id?: number) {
        //Check if its prefixed unit and remove it
        if(name.substr(0,3) == ac.unit)  name = name.substr(4)

        this.asa = {id: parseInt(name)} as ASADetails
        this.id = id ||= 0
    }


    async populateDetails(): Promise<PriceToken>{
        //Lookup
        const details = await getToken(this.asa.id)
        
        this.asa.units = details.params.total
        this.asa.decimals = details.params.decimals
        this.asa.unitName = details.params['unit-name']
        this.asa.url = details.params.url
        this.asa.name = details.params.name

        return this
    }

    static getAssetName(name: string, asa_id: number): string {
        return name + ":" + asa_id
    }

    static getUnitName(unit: string): string {
        return unit + ":px"
     }
}
