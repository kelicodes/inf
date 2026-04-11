import mongoose from "mongoose"

const productmodel=new mongoose.Schema({
	name:{
		type:String,
		required:true
	},
	price:{
		type:Number,
		required:true
	},
	desc:{
		type:String,
		required:true
	},
	images:{
		type:Array,
		required:true
	},
	category:{
		type:String,
		required:true
	},
	availability:{
		type:Boolean,
		required:true,
		default:true
	}
})


const product= mongoose.models.product || mongoose.model("productmodel",productmodel)

export default product