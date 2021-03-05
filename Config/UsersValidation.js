const { Joi } = require("express-validation");
const { UserData } = require('../models/UsersModel')
const { ExamsData } = require('../models/examModel')
const UsersValidation = {
    body: Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().regex(/[a-zA-Z0-9]{6,30}/).required(),
        role: Joi.string().required()
    })
}
const loginValidation = {
    body: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().regex(/[a-zA-Z0-9]{6,30}/).required()
    })
}
const forgotPasswordEmailValidation = {
    body: Joi.object({
        email: Joi.string().email().required()
    })
}
const newPasswordValidation = {
    body: Joi.object({
        Password: Joi.string().regex(/[a-zA-Z0-9]{6,30}/).required(),
        ConfirmPassword: Joi.string().regex(/[a-zA-Z0-9]{6,30}/).required()
    })
}

const resetPasswordValidation = {
    body: Joi.object({
        oldPassword: Joi.string().regex(/[a-zA-Z0-9]{6,30}/).required(),
        Password: Joi.string().regex(/[a-zA-Z0-9]{6,30}/).required(),
        ConfirmPassword: Joi.string().regex(/[a-zA-Z0-9]{6,30}/).required()
    })
}

let questionValidate = Joi.object().keys({
    question: Joi.string().required(),
    answer: Joi.string().required(),
    options: Joi.array().items(Joi.any()).min(4).required()
})

const createExamValidation = {
    body: Joi.object({
        subjectName: Joi.string().required(),
        notes: Joi.array().items(Joi.string()).min(1).required(),
        questions: Joi.array().items(questionValidate).min(15).required()
    })
}
// const editProfileValidation = {
//     body: Joi.object({
//         name: Joi.string().required(),
//     })
// }

const editExamValidation = {
    body: Joi.object({
        subjectName: Joi.string(),
        notes: Joi.array().items(Joi.string()).min(1),
        questions: Joi.array().items(questionValidate).min(15)
    })
}

let giveAnswerValidate = Joi.object().keys({
    question: Joi.string().required(),
    answer: Joi.string().allow('').required()
})
const giveExamValidation = {
    body: Joi.array().items(giveAnswerValidate).min(7).required()
}



const EmailChecker = async (value) => {
    try {
        return await UserData.findOne({ email: value })
    } catch (error) {
        throw error;
    }
}

const TeacherValidation = async (email) => {
    try {
        const UserObject = await UserData.findOne({ email: email })
        if (UserObject.role == "teacher") {
            return true;
        } else {
            return 'Teacher Can Access Only';
        }
    } catch (error) {
        throw { "status": "TeacherValidation", "msg": error.message }
    }
}

const studentValidation = async (email) => {
    try {
        const UserObject = await UserData.findOne({ email: email })
        if (UserObject.role == "student") {
            return true;
        } else {
            return 'Student Can Access Only';
        }
    } catch (error) {
        throw { "status": "studentValidation", "msg": error.message }
        // res.json({"msg":error.message})
    }
}

const ExamChecker = async (value) => {
    try {
        return await ExamsData.findOne({ subjectName: value, status:true })
    } catch (error) {
        throw Error(error.message);
    }
}

const examPaperRandom = (oldArray, newArray) => {
    while (newArray.length < 7) {
        var r = oldArray[Math.floor(Math.random() * oldArray.length)];
        if (newArray.indexOf(r) === -1) newArray.push(r);
    }
    return newArray;
}

module.exports = { UsersValidation, EmailChecker, TeacherValidation, ExamChecker, studentValidation, examPaperRandom, resetPasswordValidation, giveExamValidation, createExamValidation, loginValidation, forgotPasswordEmailValidation, editExamValidation, newPasswordValidation }