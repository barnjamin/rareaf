///* eslint-disable no-console */
//'use strict'
//
//
//import React from 'react'
//import {Button} from '@blueprintjs/core'
//const $ = require('jquery')
//const drawingboardJs = require('drawingboard.js')
//
//class Canvas extends React.Component {
//  constructor(props) {
//        super(props)
//        this.state = {
//            canvas:undefined
//        }
//   }
//
//
//
//   uploadToIpfs(){
//       //canvas.getImg()
//
//       //downloadImg: function() {
//       //	var img = this.getImg();
//       //	img = img.replace("image/png", "image/octet-stream");
//       //	window.location.href = img;
//       //},
//   }
//
//   componentDidMount(){
//        //const board = new DrawingBoard.Board('canvas', {
//        //    controls: [
//        //        'Color',
//        //        { Size: { type: 'dropdown' } },
//        //        { DrawingMode: { filler: false } },
//        //        'Navigation',
//        //        'Download'
//        //    ],
//        //    size: 1,
//        //    webStorage: 'session',
//        //    enlargeYourContainer: true
//        //});
//
//        //this.setState({canvas:canvas})
//   }
//
//
//   render(){
//    return (
//        <div>
//            <div className='container'>
//                <div className='content content-canvas'>
//                    <div id="canvas"></div>
//                </div>
//            </div>
//            <Button onClick={this.uploadToIpfs}>UploadIt</Button>
//        </div>
//    )
//
//   }
//
//}
//module.exports = Canvas