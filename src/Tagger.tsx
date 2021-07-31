'use strict'

import * as React from 'react'

import { MultiSelect } from "@blueprintjs/select";
import { MenuItem } from '@blueprintjs/core'

import {TagToken } from './lib/tags'
import { showErrorToaster } from './Toaster';

const TagMultiSelect = MultiSelect.ofType<TagToken>();

export const MAX_LISTING_TAGS = 8;

type TaggerProps = {
    tags: TagToken[]
    tagOpts: TagToken[]
    renderProps: any

    maxTags?: number

    setTags?(tags: TagToken[])

    handleRemoveTag?(tag: TagToken)
    handleAddTag?(tag: TagToken)
};


export function Tagger(props: TaggerProps) {

    function renderTagTag(t: TagToken) { return t.name }

    function renderTagItem(t: TagToken, {handleClick}) { 
        return ( 
            <MenuItem key={t.id} onClick={handleClick} text={t.name} />
        ) 
    }

    function handleTag(t: TagToken) { 

        if (props.maxTags && props.maxTags>0 && props.tags.length>= props.maxTags) {
            showErrorToaster("Can't apply > " + props.maxTags + " Tags")
        }

        if(props.handleAddTag !== undefined) 
           props.handleAddTag(t)

        if(props.setTags !== undefined)
            props.setTags([...props.tags, t])
    }

    function handleUntag(_tag: React.ReactNode) {
        if(props.handleRemoveTag !== undefined) 
            props.handleRemoveTag(props.tags.find((t)=>{return t.name == _tag}))

        if(props.setTags !== undefined)
            props.setTags(props.tags.filter((t)=>{ return t.name !== _tag }))
    }


    return (
        <TagMultiSelect 
            {...props.renderProps}
            placeholder="Tag your listing..."
            itemRenderer={renderTagItem}
            tagRenderer={renderTagTag}
            onItemSelect={handleTag}
            selectedItems={props.tags}
            tagInputProps={{ onRemove:handleUntag}}
            itemsEqual="id"
            items={props.tagOpts} 
        />
    )
} 