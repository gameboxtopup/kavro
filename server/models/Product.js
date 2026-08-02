const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({

    name:{
        type:String,
        required:true
    },

    slug:{
        type:String,
        unique:true
    },

    category:{
        type:String,
        required:true
    },

    price:{
        type:Number,
        required:true
    },

    discountPrice:{
        type:Number,
        default:0
    },

    image:{
        type:String,
        default:""
    },

    description:{
        type:String,
        default:""
    },
    stock: {
        type: Number,
        default: 999
    },
    featured:{
        type:Boolean,
        default:false
    },

    active:{
        type:Boolean,
        default:true
    }

},{
    timestamps:true
});

module.exports=mongoose.model("Product",productSchema);