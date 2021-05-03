interface dimensions {
    height: number
    width: number
}

interface token {
    chain:      string // Which chain its on
    asset_id:   number // Integer asset id
    creator:    string // Account on chain
    date:       Date   // Datetime it was created
}

class NFT {
    token: token

    file_hash: string // IPFS CID of file
    meta_hash: string // IPFS CID of metadata json

    // File details
    type: string  // MIME type
    size: number  // Number of bytes
    dimensions: dimensions // Dimensions of files

    // Descriptive details
    title:      string 
    description:string 
    tags:       string[]
}