
const {z} =require("zod")

const classSchema=z.object({
    className:z.string().min(3,"Class name must be at least 3 characters")
    .max(50,"Class name too long"),
    teacher:z.string().length(24,"Invalid teacher ID"),
    students:z.array(z.string().length(24,"Invalid student ID"))
})

module.exports={classSchema};