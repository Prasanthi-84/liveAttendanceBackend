//In-memory store for currently active live sessions
//only one class have active session at a time



//single global variable
let activeSession=null;

const getActiveSession=()=>{
    return activeSession;
}

const setActiveSession=(sessionData)=>{
    if(!sessionData || !sessionData.classId){
        throw new Error("Invalid session data:ClassId is required")
    }

    activeSession={
        classId:sessionData.classId,
        startedAt:sessionData.startedAt || new Date(),
        attendance:sessionData.attendance || {}
    }

    console.log(`[ACTIVE SESSION] Cleared for class ${activeSession.classId}`)
}


//clears the attendance
const clearActiveSession=()=>{
    if(activeSession){
         console.log(`[ACTIVE SESSION] Cleared for class ${activeSession.classId}`)
    }
    activeSession=null
}

//used for live attendance (websockets)
const updateAttendance=(studentId,status)=>{

    if(!activeSession){
        throw new Error("No active session to update")
    }

    if(!['present','absent'].includes(status)){
        throw new Error("Status must be 'present' or 'absent ")
    }

    activeSession.attendance[studentId]=status
    console.log(`[ACTIVE SESSION]updated ${studentId} -> ${status}`)
  

}

//to get student marked or not
const getStudentStatus=(studentId)=>{
    if(!activeSession) return null;

    return activeSession.attendance[studentId] || null;
}



const getSessionSummary=()=>{

    if(!activeSession) return null;


const present=Object.values(activeSession.attendance).filter(s=>s==="present").length;
const absent=Object.values(activeSession.attendance).filter(s=>s==='absent').length;
const totalMarked=present + absent;
//if no students then return 0
const totalStudents=activeSession.attendance
                   ?Object.keys(activeSession.attendance)
                   .length :0

return{
    classId:activeSession.classId,
    startedAt:activeSession.startedAt,
    present,
    absent,
    totalMarked,
    totalStudents,
    unmarked:totalStudents-totalMarked
}


};


module.exports={
    get:getActiveSession,
    set:setActiveSession,
    clear:clearActiveSession,
    updateAttendance,
    getStudentStatus,
    getSessionSummary
}