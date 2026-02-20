

const express=require('express')
const router=express.Router()

const authMiddleware=require('../middleware/authMiddleware.js')
const {getMyAttendance, startAttendance}=require('../controllers/attendanceController.js')


router.use(authMiddleware)

router.get('/class/:id/my-attendance',getMyAttendance)
router.post('/start',startAttendance)


module.exports=router