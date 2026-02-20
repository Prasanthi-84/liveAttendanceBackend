

const {  mongoose } = require("mongoose");
const Class=require("../models/Class");
const User=require("../models/User");
const {z}=require('zod');



//validate schema
const createClassSchema=z.object({
    className:z.string().min(3,"Class name must be atleast 3 characters")  
})

const addStudentSchema=z.object({
    studentId:z.string().length(24,"Invalid student Id Format")
})



//create a new class(techer only)
const createClass=async(req,res)=>{
    try{
    const {className}=createClassSchema.parse(req.body);

    if(req.user.role !== 'teacher'){

        
        return res.status(403).json({message:"Only teachers can create classes"})
    }


    const newClass=new Class({
        className,
        teacher:req.user.id
    })

    await newClass.save();

    res.status(201).json({
        message:"Class created successfully",
        id:newClass._id,
        className:newClass.className,
        teacher:req.user.id
    });
    }
    catch(error){
        if(error instanceof z.ZodError){
            return res.status(400).json({
                message:error.errors?.[0]?.message  || "Invalid request schema"
            });
        }
        return res.status(500).json({message:'Server error'});
    }

}


//addstudent to class
const addStudentToClass=async(req,res)=>{

    try{
    const {studentId}=addStudentSchema.parse(req.body)
    const {classId}=req.params;

     const classRoom=await Class.findById(classId)
     if(!classRoom) return res.status(404).json({
        message:'class not found'
     })

     if(classRoom.teacher.toString() !==req.user.id){
        return res.status(403).json({
            message:'Only the class teacher can add the students'
        })
     }

     const student=await User.findOne({_id:studentId,role:'student'})
     if(!student)return res.status(404).json({
        message:'Student not found or not a student role'
     })


     if(classRoom.students.some(id=>id.toString()===studentId)){
        return res.status(400).json({message:'Student already in this class'})
     }

     classRoom.students.push(studentId);
     await classRoom.save()
     
    res.json({ message: 'Student added successfully', class: classRoom });
}
catch (error) {

    console.error("ADD STUDENT ERROR 👉", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors?.[0]?.message || "Invalid request schema" });
    }
    return res.status(500).json({ message: 'Server error' });
  }

};

//get all classes for the logged in user

const getMyClasses = async (req, res) => {
  try {

     if(!req.user || !req.user.id || !req.user.role){
        return res.status(401).json({
            message:"Unauthorized access"
        })
     }

    let classes;

    if (req.user.role === "teacher") {
      classes = await Class.find({ teacher: req.user.id })
        .populate("students", "name email")
        .select("className students createdAt")
        .sort({createdAt:-1})
        .lean() //performance
    } else {
      classes = await Class.find({ students: req.user.id })
        .populate("teacher", "name")
        .select("className teacher createdAt")
        .sort({createdAt:-1})
    }

    return res.status(200).json({
      success: true,
      data: classes,
      count:classes.length
    });
  } catch (error) {
    console.error("GET MY CLASSES ERROR 👉", error);
    return res.status(500).json({ message: "Server error" });
  }
};

//returns all details of class
const getClassById=async(req,res)=>{

  try{
 
    const {id}=req.params;

//validate id format 
    if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(400).json({
            success:false,
            message:"Invalid class ID format"
        })
    }
//find class with populated data
const classRoom=await Class.findById(id)
       .populate({
        path: 'students',
        select:'name email'     
      })
       .populate({
        path:'teacher',
        select:'name email'
       })
       .lean()


if(!classRoom){
    return res.status(404)
               .json({
                success:false,
                message:"Class not found"
               })
}

//authorization
const currentUserId=req.user.id;

//is logged-in userr=class teacher
const isTeacher=classRoom.teacher._id.toString() === currentUserId;

const isEnrolledStudent=
    Array.isArray(classRoom.students) &&
    classRoom.students.some(
    student=>student._id.toString() === currentUserId

)

if(!isTeacher && !isEnrolledStudent){
    return res.status(403).json({
        success:false,
        message:"You are not authorized to view this class"
    })
}
return res.status(200).json({
    success:true,
    data:classRoom
})
  }
  catch(error){
    return res.status(500).json({
        success:false,
        message:'Server error'
    })
  }

}

//get students
const getStudentsById=async(req,res)=>{
    try{
      const {id}=req.params

      //object validation
      if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(400).json({
            success:false,
            message:"Invalid class ID format"
        })
      }

      const classRoom=await Class.findById(id)
             .populate({
                path:'students',
                select:'name email'
             })
             .lean()
      if(!classRoom){
            return res.status(404).json({
            success:false,
            message:"Class not found"
        })
    }
    //authorization
     const currentUserId=req.user.id;

    //is logged-in user=class teacher
    const isTeacher=classRoom.teacher.toString() === currentUserId;

    if(!isTeacher){
        return res.status(403).json({
            success:false,
            message:"Only teacher can access this class"
        })
    }

    return res.status(200).json({
        success:true,
        data:classRoom.students
    })

    }
    catch(error){
        return res.status(500).json({
            success:false,
            message:"Server error"
        })
    }
}







module.exports={createClass,addStudentToClass,getMyClasses,getClassById,getStudentsById}

