require("dotenv").config();

const express=require('express');

//adding ws to existing http server
const http=require("http")
const webSocket=require("ws")
const jwt=require('jsonwebtoken')

const connectDB=require("./config/db");

const authRoutes=require('./routes/authRoutes');
const classRoutes=require('./routes/classRoutes')
const attendanceRoutes=require('./routes/attendanceRoutes.js')

//import activeSession ->In-memory db
const {
    get:getActiveSession,
    set:setActiveSession,
    clear:clearActiveSession,
    updateAttendance,
    getStudentStatus,
    getSessionSummary
}=require('./utils/activeSession.js');

const Class =require("./models/Class.js")
const Attendance = require("./models/Attendance");


const app=express();
//create httpServer
const server=http.createServer(app)

//attach webserver
const wss=new webSocket.Server({server})

app.use(express.json());

app.use('/auth',authRoutes);
app.use('/class',classRoutes)
app.use('/attendance',attendanceRoutes)

//connection to mongoose
connectDB();



app.get("/",(req,res)=>{
    res.send("Server Started 🚀")
})



//websocket connection handling
wss.on('connection',(ws,req)=>{

 //1.extract token from query string   
  const url=new URL(req.url,`http://${req.headers.host}`)
  const token=url.searchParams.get("token")


  if(!token){
    ws.send(JSON.stringify({
        error:"ERROR",
        data:{message:"Token required in query string(?token=....)"}
    }))
    ws.close(1008,"Token required")
    return;
  }

  //2.verify jwt(attach user context to connection)
  try{
      const decoded=jwt.verify(token,process.env.JWT_SECRET)
      ws.user={
        userId:decoded.id,
        role:decoded.role
      }
      console.log(`[WS] Authenticated user:${ws.user.userId} (${ws.user.role})`)
  }
  catch(error){
    ws.send(JSON.stringify({
        event:"ERROR",
        data:{message:"Unauthorized or invalid token"}
    }))
    ws.close(1008,"Invalid token")
    return;
  }

  //3.websocket connection is ready
    ws.send(JSON.stringify({
        event:"CONNECTED",
        data:{message:"websocket connected successfully"}
    }))

  //4.listen for messages(event based messaging)
  ws.on("message",(message)=>{
      try{
          const data=JSON.parse(message.toString())
          const event=data.event;
          const payload=data.data || {};

          console.log(` [WS] Recieved event:${event} from ${ws.user.userId}`)

              switch(event){
                 case "ATTENDANCE_MARKED":
                    handleAttendanceMarked(ws,payload)
                    break;
                 
                 case "TODAY_SUMMARY":
                    handleTodaySummary(ws)
                    break;
                
                 case "MY_ATTENDANCE":
                    handleMyAttendance(ws)
                    break;
                
                  case "DONE":
                    handleDone(ws);
                    break;

                  default:
                      ws.send(JSON.stringify({
                        event:"ERROR",
                        data:{message:`Unknown event: ${event}`}
                      }))
              }
      }
      catch(error){
             ws.send(JSON.stringify({
                event:"ERROR",
                data:{message:"Invalid message format"}
             }))
      }
  });

  ws.on("close",()=>{
     console.log(`[WS] client disconnected:${ws.user?.userId || "unknown"}`)
  })
})

//event handlers
function handleAttendanceMarked(ws,payload){

    //teacher can only access
    if(ws.user.role !== "teacher"){
        return ws.send(JSON.stringify({
            event:"ERROR",
            data:{message:"Forbidden,teacher event only"}
        }))
    }

     const {studentId,status}=payload
     if(!studentId || !['present','absent'].includes(status)){
        return ws.send(JSON.stringify({
            event:"ERROR",
            data:{message:"Invalid studentId or status"}
        }))
     }

     const session=getActiveSession();
     if(!session){
        return ws.send(JSON.stringify({
            event:"ERROR",
            data:{message:"No active attendance session"}
        }))
     }
    

     updateAttendance(studentId,status)


     //broadcast to all connected clients
     wss.clients.forEach((client)=>{
        if(client.readyState === WebSocket.OPEN){
            client.send(JSON.stringify({
                event:"ATTENDANCE_MARKED",
                data:{studentId,status}
            }))
        }
     })
}



function handleTodaySummary(ws){

    //teacher can only access
    if(ws.user.role !== "teacher"){
        return ws.send(JSON.stringify({
            event:"ERROR",
            data:{message:"Forbidden,teacher event only"}
        }))
    }

     const session=getActiveSession();
     if(!session){
        return ws.send(JSON.stringify({
            event:"ERROR",
            data:{message:"No active attendance session"}
        }))
     }

     const summary=getSessionSummary()

      //broadcast to all connected clients
     wss.clients.forEach((client)=>{
        if(client.readyState === WebSocket.OPEN){
            client.send(JSON.stringify({
                event:"TODAY_SUMMARY",
                data:summary
            }))
        }
     })


 

}


function handleMyAttendance(ws){

   if(ws.user.role !== "student"){
        return ws.send(JSON.stringify({
            event:"ERROR",
            data:{message:"Forbidden,student event only"}
        }))
    }

     const session=getActiveSession();
     if(!session){
        return ws.send(JSON.stringify({
            event:"MY_ATTENDANCE",
            data:{message:"No active  session"}
        }))
     }

     const status=getStudentStatus(ws.user.userId) || "not yet updated"

     //unicast->only to the client
       ws.send(JSON.stringify({
        event:"MY_ATTENDANCE",
        data:{status}
       }))

}

async function handleDone(ws){

     //teacher can only access
    if(ws.user.role !== "teacher"){
        return ws.send(JSON.stringify({
            event:"ERROR",
            data:{message:"Forbidden,teacher event only"}
        }))
    }

     const session=getActiveSession();
     if(!session){
        return ws.send(JSON.stringify({
            event:"ERROR",
            data:{message:"No active attendance session"}
        }))
     }

    
     try{
         //fetch the class to know all enrolled students
         const classRoom=await Class.findById(session.classId);
         if(!classRoom){
            clearActiveSession()
            return ws.send(JSON.stringify({
                event:"ERROR",
                data:{message:"Class no longer exists-session cleared"}
            }))
         }


         //auto-mark absent for enrolled students not yet marked
            const enrolled=classRoom.students.map(id=>id.toString())
            for(const studentId of enrolled){
               if(!session.attendance[studentId]){
                   session.attendance[studentId]="absent"
               }
            }

        //save all to db
        const date=new Date();
        const records=Object.entries(session.attendance).map(([studentId,status])=>({
            classId:session.classId,
            studentId,
            status,
            date
        }));


      console.log(`Attempting to save ${records.length} records`);
      await Attendance.insertMany(records)
      console.log(`[DONE] Saved ${records.length} attendance records to DB`);

      
      //broadcast final summary
      const summary=getSessionSummary()

      wss.clients.forEach(client=>{
        if(client.readyState === WebSocket.OPEN){
            client.send(JSON.stringify({
                event:"DONE",
                data:{
                    message:"Attendance completed & saved automatically",
                    present:summary.present,
                    absent:summary.absent,
                    total:summary.total,
                    percentage:summary.total>0
                        ?((summary.present/summary.total)*100).toFixed(1) +"%"
                        : "0%"
                }
             
            }))
        }
      })
      clearActiveSession();

     }
     catch(error){
     
    console.error("[DONE CRITICAL ERROR] Failed to persist:", error.name, error.message);
    console.error("Stack:", error.stack ? error.stack.substring(0, 500) : "no stack");
    // console.log("[DONE] Session ended.Attendance:",session.attendance)
      ws.send(JSON.stringify({
        event:"ERROR",
        data:{message:"Failed to save attendance in database  - so session cleared"},
        errorType: error.name,
        errorDetail: error.message
      }))

   clearActiveSession();
    
}
}









const PORT=process.env.PORT || 3000;
server.listen(PORT,()=>{
    console.log(`Server Started on port ${PORT}`)
})