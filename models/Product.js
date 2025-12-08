const mongoose = require('mongoose')

const productSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true
    },
    quantity: {
        type: int,
        required: [true, 'Product quantity is required'],
        default: 0
    } 

})
