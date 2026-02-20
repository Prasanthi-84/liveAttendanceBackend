


const {z}=require("zod");

const signupSchema=z.object({
    name:z.string().min(2),
    email:z.string().email({ message: "Invalid email" }).transform((s) => s.toLowerCase()),
    password:z.string().min(6),
    role:z.enum(["teacher","student"])

});

const loginSchema=z.object({
    email:z.string().email({ message: "Invalid email" }).transform((s) => s.toLowerCase()),
    password:z.string().min(6)
})

module.exports={signupSchema,loginSchema}