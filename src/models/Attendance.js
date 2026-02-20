const mongoose=require('mongoose')


const attendanceSchema=new mongoose.Schema({
    ClassId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Class',
        required:true
    },
    StudentId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true,
    },
    Status:{
        type:String,
        enum:['present','absent'],
        required:true
    },
    date:{
        type:Date,
        default:Date.now
    }
},{timestamps:true})

module.exports=mongoose.model('Attendance',attendanceSchema)