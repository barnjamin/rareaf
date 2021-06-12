'use strict'

import { ItemRenderer, MultiSelect } from "@blueprintjs/select";
import * as React from 'react'
import { Button, MenuItem } from '@blueprintjs/core'
import {TagToken } from './lib/listing'
import { pseudoPropNames } from "@chakra-ui/react";


const TagMultiSelect = MultiSelect.ofType<TagToken>();

type TaggerProps = {
    tags: TagToken[]
    tagOpts: TagToken[]
    setTags(tags: TagToken[])
};

type TaggerState = {
    tags: TagToken[]
};

export default class Tagger extends React.Component<TaggerProps, TaggerState> {
    props: TaggerProps;
    state: TaggerState = { tags: [] };

    constructor(props){ 
        super(props) 

        this.state.tags = props.tags ||= []

        this.renderTagItem = this.renderTagItem.bind(this)
        this.renderTagTag  = this.renderTagTag.bind(this)

        this.handleTag     = this.handleTag.bind(this)
        this.handleUntag   = this.handleUntag.bind(this)
    }

    renderTagTag(t: TagToken) { return t.name }
    renderTagItem(t: TagToken, {handleClick}) { 
        return ( 
            <MenuItem key={t.id} onClick={handleClick} text={t.name} />
        ) 
    }

    handleTag(t: TagToken) { 
        this.setState((curstate)=>{
            return {tags: curstate.tags.concat(t)}
        })
        this.props.setTags(this.state.tags)
    }

    handleUntag(_tag: React.ReactNode) {
        this.setState((curstate)=>{
            return { tags:  curstate.tags.filter((t)=>{ return t.name !== _tag }) }
        })
        this.props.setTags(this.state.tags)
    }

    render() {
        return (
            <TagMultiSelect 
                fill={true}
                placeholder="Tag your listing..."
                itemRenderer={this.renderTagItem}
                tagRenderer={this.renderTagTag}
                onItemSelect={this.handleTag}
                selectedItems={this.state.tags}
                tagInputProps={{ onRemove:this.handleUntag minimal: true, }}
                itemsEqual="id"
                items={this.props.tagOpts} 
            />
        )
    }
} 