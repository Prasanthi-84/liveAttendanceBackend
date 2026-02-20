

const jwt=require('jsonwebtoken');

/*
  protects the routes by verfying  jwt token.
  It ensures that only authenticated users can access secured APIs
 */



const authMiddleware=(req,res,next)=>{

    /*
     1.read the authorization header
     expected format:
       Authorization:Bearer <JWT_TOKEN>
    
    */ 
    const authHeader = req.header('Authorization') || req.header('authorization');

    // console.log('[AUTH] Received header:', authHeader);
    /*
    2.check if token exists
    if token is missing deny access
    */

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: "No token provided" });

    }

      /*
      3.extract actual token value
      removes the Bearer part and keeps only JWT
      */
      
    const token = authHeader.replace('Bearer ', '').trim();
    //console.log('[AUTH] Token (first 20 chars):', token.substring(0,20) + '...');
    

    try{
        /*
        4.verify the token using secret key
        confirms tokrn->checks if token expired->decodes user data inside token
        */
          // console.log('[AUTH] JWT_SECRET exists?', !!process.env.JWT_SECRET);
           //console.log('[AUTH] JWT_SECRET (first 10 chars):', process.env.JWT_SECRET?.substring(0,10) || 'MISSING');
 
            if (!process.env.JWT_SECRET) {
              console.error('[AUTH FATAL] JWT_SECRET is undefined or empty!');
              return res.status(500).json({ message: 'Server configuration error' });
            }

          const decoded=jwt.verify(token,process.env.JWT_SECRET);
          /*
          5.attach decoded user data to req obj
          ->who the user is?what role the user has?
          */
        // console.log('[AUTH] Token verified successfully');
        // console.log('[AUTH] Decoded payload:', decoded);
           
        req.user={
            id:decoded.id,
            role:decoded.role
        };

        

        /*6.pass control to next middleware*/
        next();
    }
    catch(error){

         console.error('[JWT VERIFY ERROR] Name:', error.name);
         console.error('[JWT VERIFY ERROR] Message:', error.message);
         console.error('[JWT VERIFY ERROR] Full stack:', error.stack);
        
        if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token has expired' });
        }
       if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token signature or format' });
     }
                
         /*7.Handle expired tokens*/
        return res.status(401).json({
            message:'Invalid or expired token'
        })
    }
}


module.exports=authMiddleware