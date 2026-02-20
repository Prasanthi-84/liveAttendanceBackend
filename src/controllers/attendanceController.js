
//returns the current  attendance status of the enrolled students
//only:enrolled students or class teacher can access

const mongoose =require('mongoose');
const {get:getActiveSession,set:setActiveSession}=require('../utils/activeSession.js')
const Class=require('../models/Class.js')
const {z}=require('zod')




const startAttendanceSchema=z.object({
    classId:z.string().length(24,"Invalid class ID format")
})


//starts a live attendance session for a specific  class
//only teacher can start the session
//only one class can have active session at a time and in memory activesession
const startAttendance=async(req,res)=>{

    try{

      const {classId}=startAttendanceSchema.parse(req.body)
  
      //only teachers
      if(req.user.role !== "teacher"){
          return res.status(403).json({
            success:false,
            message:"Only teachers can start attendance"
          })
      }
  
      const classRoom=await Class.findById(classId);
      if(!classRoom){
        return res.status(404).json({
        success:false,
        message:"Class not found"
      })
      }
     
      if(classRoom.teacher.toString() !== req.user.id){
        return res.status(403).json({
            success:false,
            message:"You are not owner of this class"
        })
      }

      const currentSession=getActiveSession()
      if(currentSession){
        return res.status(400).json({
            success:false,
            message:`Another class (${currentSession.classId}) already has an active attendance.End it first`
        })
      }

   //start new session
   const newSession={
    classId:classId.toString(),
    startedAt:new Date(),
    attendance:{}
   }

   setActiveSession(newSession)

   return res.status(200)
             .json({
              success:true,
              message:"Attendance session started successfully",
              data:{
                classId:newSession.classId,
                startedAt:newSession.startedAt.toISOString(),
                totalStudents:classRoom.students.length
              }
             })
            

    }
  catch(error){
   return res.status(500).json({
    success:false,
    message:"Server error while starting attendance"
   })
    }
}




const getMyAttendance=async(req,res)=>{
    try{
      const {id}=req.params //classId
      const currentUserId=req.user.id
      const userRole=req.user.role
      
      //valid id format
      if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(400).json({
            success:false,
            message:"Invalid class ID format"
        })
      }

const session=getActiveSession();
      //check if active session exists for this class
      if(!session || session.classId !== id.toString()){
         return res.status(200).json({
            success:true,
            data:{
                classId:id,
                status:null,  //no active session->not marked
                message:"No active session attendance for this class"
            }
         })
      }

      //authorization :only for enrolled students or teachers
      const classRoom=await Class.findById(id);
      if(!classRoom){
        return res.status(404)
                   .json({
                    success:false,
                    message:"Class not found"
                   })
      }

      const isTeacher=classRoom.teacher.toString() === currentUserId;
      const isEnrolledStudent=classRoom.students.some(
        studentId=>studentId.toString() === currentUserId
      )

      if(!isTeacher && !isEnrolledStudent){
        return res.status(403).json({
            success:false,
            message:"You are not authorized to view attendance of this class"
        })
      }

      //get the users own status from activesession
       const userStatus=
                        userRole === "student"
                        ?session.attendance[currentUserId]
                        :null;

       return res.status(200).json({
        success:true,
        data:{
            classId:id,
            status:userStatus
        }
       })
                      

      }
    catch(error){
         return res.status(500).json({
            success:false,
            message:"server error"
         })
    }
}





module.exports={getMyAttendance,startAttendance}
