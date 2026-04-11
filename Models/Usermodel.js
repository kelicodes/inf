import mongoose from "mongoose"

const userModel=new mongoose.Schema({
	name:{
		type:String,
		required:true
	},
	password:{
		type:String,
		required:true
	},
	email:{
		type:String,
		required:true,
		unique:true
	},
	resetCode:{
		type:String
	},
	codeDate:{
		type:Date
	}
})


const user= mongoose.models.user ||  mongoose.model("user",userModel)

export default user