const mongoose=require("mongoose")

const ClassSchema=new mongoose.Schema({
    className:{
      type:String,
      required:true,
      trim:true
    },
    //stores teacherId
    //objectId:referneces a doc from another collection
    teacher:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',//links to user model
        required:true,

    },
    //Array of student IDs
    //allows multiple students in a one class
    students:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
    }]
},{timestamps:true})

module.exports=mongoose.model('Class',ClassSchema);
