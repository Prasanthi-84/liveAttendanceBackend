
const {z}=require('zod');

const userSchema=z.object({
     name:z.string().min(3,"Name must be more than 3").max(25,"Name must be at most 25 charcters"),
     email:z.string().email({ message: "Invalid email" }).transform((s) => s.toLowerCase()),
     password:z.string().min(6,"Password must be at least 6 characters"),
     role:z.enum(['teacher','student'])
})

module.exports={userSchema}