'use strict'

import { ItemRenderer, MultiSelect } from "@blueprintjs/select";
import * as React from 'react'
import { Button, MenuItem } from '@blueprintjs/core'
import {TagToken, Listing} from './lib/listing'


const TagMultiSelect = MultiSelect.ofType<TagToken>();

type TaggerProps = {
    listing: Listing;
    handleAddTag(tag: TagToken);
    handleRemoveTag(tag: TagToken);
};

type TaggerState = {
};

export default class Tagger extends React.Component<TaggerProps, TaggerState> {
    props: TaggerProps;
    state: TaggerState = {};


    constructor(props){ 
        super(props) 
        this.renderTagItem = this.renderTagItem.bind(this)
        this.renderTagTag = this.renderTagTag.bind(this)

        this.handleTag = this.handleTag.bind(this)
        this.handleUntag = this.handleUntag.bind(this)
    }

    renderTagTag(t: TagToken) { return t.name }
    renderTagItem(t: TagToken, {handleClick}) { 
        return ( 
            <MenuItem key={t.id} onClick={handleClick} text={t.name}/>
        ) 
    }

    handleTag(t: TagToken) { this.props.handleAddTag(t) }
    handleUntag(_tag: React.ReactNode, index: number) {
        this.props.handleRemoveTag(this.props.listing.tags[index])
        console.log(_tag, index)
    }

    render() {


        return (
            <div>
                <TagMultiSelect 
                    placeholder="Tag your listing..."
                    itemRenderer={this.renderTagItem}
                    tagRenderer={this.renderTagTag}
                    onItemSelect={this.handleTag}
                    selectedItems={this.props.listing.tags}
                    tagInputProps={{ 
                        onRemove:this.handleUntag
                        minimal: true,
                    }}
                    itemsEqual="id"
                    items={this.props.tagOpts} 
                />
            </div>
        )
    }
} 