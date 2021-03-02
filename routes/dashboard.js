const express = require('express');
const { validate, ValidationError } = require('express-validation')
const { TokenVerify } = require('../Config/Authentication')
const { } = require('../controllers/UsersController')
const { createExamValidation, editExamValidation } = require('../Config/UsersValidation')
const { StudentDataController, VerifiedStudentController, CreateExamController, viewExamController, examDetailController, editExamController, deleteExamController, viewStudentDetailController } = require('../controllers/DashboardController')
const router = express.Router();

router.get('/', TokenVerify, StudentDataController)
router.get('/StudentForExam', TokenVerify, VerifiedStudentController)
router.get('/viewStudentDetail', TokenVerify, viewStudentDetailController)
router.post('/Exam', TokenVerify, validate(createExamValidation), CreateExamController)
router.get('/viewExam', TokenVerify, viewExamController)
router.get('/examDetail', TokenVerify, examDetailController)
router.put('/editExam', TokenVerify, validate(editExamValidation), editExamController)
router.delete('/deleteExam', TokenVerify, deleteExamController)
router.use((err, req, res, next) => {
    if (err instanceof ValidationError) {
        return res.status(err.statusCode).json(err)
    }
    return res.status(500).json(err)
})
module.exports = router;