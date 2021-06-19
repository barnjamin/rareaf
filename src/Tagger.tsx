'use strict'

import * as React from 'react'

import { MultiSelect } from "@blueprintjs/select";
import { MenuItem } from '@blueprintjs/core'

import {TagToken } from './lib/listing'


const TagMultiSelect = MultiSelect.ofType<TagToken>();

type TaggerProps = {
    tags: TagToken[]
    tagOpts: TagToken[]
    renderProps: any

    setTags?(tags: TagToken[])

    handleRemoveTag?(tag: TagToken)
    handleAddTag?(tag: TagToken)
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
        this.props.handleAddTag(t)

        this.setState((curstate)=>{
            return {tags: curstate.tags.concat(t)}
        })
    }

    handleUntag(_tag: React.ReactNode) {

        this.props.handleRemoveTag(this.state.tags.find((t)=>{t.name == _tag}))

        this.setState((curstate)=>{
            return { tags:  curstate.tags.filter((t)=>{ return t.name !== _tag }) }
        })
    }

    render() {
        return (
            <TagMultiSelect 
                {...this.props.renderProps}
                placeholder="Tag your listing..."
                itemRenderer={this.renderTagItem}
                tagRenderer={this.renderTagTag}
                onItemSelect={this.handleTag}
                selectedItems={this.state.tags}
                tagInputProps={{ onRemove:this.handleUntag}}
                itemsEqual="id"
                items={this.props.tagOpts} 
            />
        )
    }
} 