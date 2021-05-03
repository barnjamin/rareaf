interface dimensions {
    height: number
    width:  number
}

interface token {
    chain:    string // Which chain its on
    asset_id: number // Integer asset id
    creator:  string // Account on chain
    date:     Date   // Datetime it was created
}

export default class NFT {
    token: token

    file_hash: string // IPFS CID of file
    meta_hash: string // IPFS CID of metadata json

    // File details
    type: string  // MIME type
    size: number  // Number of bytes

    dimensions?: dimensions // Dimensions of files

    // Descriptive details
    title:      string 
    artist:     string
    description:string 

    tags:       string[]

    constructor(metadata: NFT) {
        this.title       = metadata.title        
        this.artist      = metadata.artist
        this.description = metadata.description
        this.file_hash   = metadata.file_hash
    }

    imgSrc (): string {
        return 'http://ipfs.io/ipfs/'+this.file_hash
    }
}