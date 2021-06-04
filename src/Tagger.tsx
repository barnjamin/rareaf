'use strict'

import { ItemRenderer, MultiSelect } from "@blueprintjs/select";
import * as React from 'react'
import { Button, MenuItem } from '@blueprintjs/core'
import {TagToken, Listing} from './lib/listing'


const TagMultiSelect = MultiSelect.ofType<TagToken>();

type TaggerProps = {
    listing: Listing;
    handleTag(tag: TagToken);
};

type TaggerState = {
};

export default class Tagger extends React.Component<TaggerProps, TaggerState> {
    props: TaggerProps;
    state: TaggerState = {};

    constructor(){ 
        super() 
        this.renderTagItem = this.renderTagItem.bind(this)
        this.renderTagTag = this.renderTagTag.bind(this)
        this.itemSelected = this.itemSelected.bind(this)
    }

    renderTagItem(t: TagToken, {handleClick}){ return ( <MenuItem key={t.id} onClick={handleClick} text={t.name}/>) }
    renderTagTag(t: TagToken) { return t.name }
    itemSelected(t: TagToken) { this.props.handleTag(t) }

    render() {
        return (
            <div>
                <TagMultiSelect 
                    itemRenderer={this.renderTagItem}
                    tagRenderer={this.renderTagTag}
                    onItemSelect={this.itemSelected}
                    selectedItems={this.props.listing.tags}
                    items={this.props.tagOpts} 
                />
            </div>
        )
    }
} 