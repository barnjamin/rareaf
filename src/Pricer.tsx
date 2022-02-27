'use strict'

import * as React from 'react'

import { MultiSelect } from "@blueprintjs/select";
import { MenuItem } from '@blueprintjs/core'

import { PriceToken } from './lib/price'
import { searchForAssetsByName } from './lib/algorand';

const PriceMultiSelect = MultiSelect.ofType<PriceToken>();

type PricerProps = {
    prices: PriceToken[]
    renderProps: any

    setPrices?(prices: PriceToken[])

    handleRemovePrice?(price: PriceToken)
    handleAddPrice?(price: PriceToken)
};


export function Pricer(props: PricerProps) {

    const [priceOpts, setPriceOptions] = React.useState([])

    function renderPriceTag(p: PriceToken) { return p.asa.name }

    function renderPriceItem(t: PriceToken, {handleClick}) { 
        return ( 
            <MenuItem key={t.asa.id} onClick={handleClick} text={t.asa.name + " ("+t.asa.id+")"} />
        ) 
    }

    function handlePrice(p: PriceToken) { 
        if(props.handleAddPrice !== undefined) 
           props.handleAddPrice(p)

        if(props.setPrices !== undefined)
            props.setPrices([...props.prices, p])
    }

    function handleUnprice(_tag: React.ReactNode) {
        if(props.handleRemovePrice !== undefined) 
            props.handleRemovePrice(props.prices.find((p)=>{return p.asa.name == _tag}))

        if(props.setPrices !== undefined)
            props.setPrices(props.prices.filter((p)=>{ return p.asa.name !== _tag }))
    }

    function searchForAssets(name) {
        searchForAssetsByName(name).then((pts)=>{ setPriceOptions(pts) })
    }

    return (
        <PriceMultiSelect 
            {...props.renderProps}
            placeholder="Add Price tokens"
            itemRenderer={renderPriceItem}
            tagRenderer={renderPriceTag}
            onItemSelect={handlePrice}
            onQueryChange={searchForAssets}
            selectedItems={props.prices}
            tagInputProps={{onRemove:handleUnprice}}
            itemsEqual="id"
            items={priceOpts} 
        />
    )
} 