

const User=require("../models/User");
const bcrypt=require("bcrypt");
const jwt=require('jsonwebtoken');
const {signupSchema,loginSchema}=require('../validators/auth.validator');


//signup schema
const signup=async(req,res)=>{

    try{
 
        // console.log("REQ BODY 👉", req.body);


    //validate body
    const {name,email,password,role}=signupSchema.parse(req.body)

    //check if user exists
    const existingUser=await User.findOne({email});
    if(existingUser){
        return res.status(400).json({message:'User already exists'});
    }

    //hash pass
    const hashedPassword=await bcrypt.hash(password,10);

    //create user
    const user=await User.create({
        name,
        email,
        password:hashedPassword,
        role
    })

    //generate jwt
    const token=jwt.sign(
        {id:user._id,role:user.role},
        process.env.JWT_SECRET,
        {expiresIn:"7d"}
    );

    //send response
    res.status(201).json({
        message:'User registered successfully',
        token,
        user:{
            id:user._id,
            name:user.name,
            email:user.email,
            role:user.role
        }
    });
    }catch(error){
        if(error.name === "ZodError"){
            return res.status(400).json({ message: error.errors?.[0]?.message || "Validation error" });
        }
        console.error("Signup error:",error);
        res.status(500).json({message:"Server error during signup"});
        
    }

}



//loginSchema

const login=async (req,res)=>{
  try{
    
    const {email,password}=loginSchema.parse(req.body);

    const user=await User.findOne({email})
    if(!user){
        return res.status(400).json({message:'Invalid email or password'});
    }

    const isMatch=await bcrypt.compare(password,user.password);
    if(!isMatch){
           return res.status(400).json({ message: "Invalid email or password" });
    }

     //generate jwt
    const token=jwt.sign(
        {id:user._id,role:user.role},
        process.env.JWT_SECRET,
        {expiresIn:"7d"}
    );
 
     //send response
    res.status(201).json({
        message:'Login successful',
        token,
        user:{
            id:user._id,
            name:user.name,
            email:user.email,
            role:user.role
        }
    });
     
  }
  catch(error){
     if(error.name === "ZodError"){
            return res.status(400).json({ message: error.errors?.[0]?.message || "Validation error" });
        }
        console.error("login error:",error);
        res.status(500).json({message:"Server error during login"});
        
    }
}

//get user
const getme=async(req,res)=>{
    try{
             const userId=req.user.id;
             const user=await User.findById(userId).select("-password");
             if(!user){
                return res.status(404).json({message:"User not found"})
             }
             res.status(200).json({
                user
             })
    }
    catch(error){
         console.error("GetME error:",error),
         res.status(500).json({message:"Server error"})
    }
}


module.exports={signup,login,getme}
