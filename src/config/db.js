const mongoose=require("mongoose")
require('dotenv').config();


const connectDB=async ()=>{
    try{
      await mongoose.connect(process.env.MONGO_DB_URI);
      console.log('MongoDB Connection Successfully ✅')
    }catch(error){
        console.error('MongoDB Connection Error:',error.message)
    }
}
module.exports=connectDB;