/* eslint-disable no-console */
'use strict'


const React = require('react')

class Canvas extends React.Component {
  constructor(props) {
        super(props)

   }

   render(){
    return (
        <div className='container'>
            <div className='content content-canvas'>
                <div id="canvas"></div>
            </div>
        </div>
    )

   }

}
module.exports = Canvas