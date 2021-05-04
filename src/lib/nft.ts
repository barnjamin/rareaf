interface dimensions {
    height: number
    width:  number
}

export default class NFT {
    asset_id: number

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
        if (this.file_hash !== undefined)
            return 'http://ipfs.io/ipfs/'+this.file_hash

        return "https://via.placeholder.com/500"
    }
}