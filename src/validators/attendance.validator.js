

const {z} =require('zod')

const markattendanceSchema=z.object({
      classId:z.string().length(24,"Invalid classId"),
      studentId:z.string().length(24,"Invalid studentId"),
      status:z.enum(["present","absent"])
})


module.exports={markattendanceSchema}