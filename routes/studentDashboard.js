const express = require('express');
const { TokenVerify } = require('../Config/Authentication')
const { validate, ValidationError } = require('express-validation')
const { giveExamValidation } = require('../Config/UsersValidation')
const { studentExamController, studentProfileController, giveExamController, examPaperController } = require('../controllers/studentController')
const router = express.Router();

router.get('/studentExam', TokenVerify, studentExamController)
router.put('/studentProfile', TokenVerify, studentProfileController)
router.get('/examPaper', TokenVerify, examPaperController)
router.post('/giveExam', TokenVerify, validate(giveExamValidation), giveExamController)

router.use((err, req, res, next) => {
    if (err instanceof ValidationError) {
        return res.status(err.statusCode).json(err)
    }
    return res.status(500).json(err)
})

module.exports = router;