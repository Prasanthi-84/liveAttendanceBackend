


const express=require('express')
const router=express.Router();

const {createClass,addStudentToClass,getMyClasses,getClassById,getStudentsById}=require('../controllers/classController')
const authMiddleware=require('../middleware/authMiddleware')


router.use(authMiddleware)

router.post('/create',createClass)
router.post('/:classId/add-student',addStudentToClass)
router.get('/my',getMyClasses)
router.get('/:id',getClassById)
router.get('/:id/students',getStudentsById)

module.exports=router

