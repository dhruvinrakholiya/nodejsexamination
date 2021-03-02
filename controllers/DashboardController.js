const { TeacherValidation, ExamChecker } = require('../Config/UsersValidation');
const { ExamsData } = require('../models/examModel');
const { UserData } = require('../models/UsersModel')
const { resultsData } = require('../models/resultModel');
const mongoose = require('mongoose');

const errorMsg = (value) => {
    if (value != true) throw Error(value)
}

const StudentDataController = async (req, res) => {
    try {
        errorMsg(await TeacherValidation(req.obj))
        const StudentData = await UserData.find({ role: 'student' }, { _id: 1, name: 1, email: 1, status: 1 });
        const count = await UserData.count();
        return res.json({ statusCode: 200, message: "All Student data show successfully", data: StudentData, count: count })
    } catch (error) {
        return res.json({ statusCode: 500, message: error.message, data: null })
    }
}

const viewStudentDetailController = async (req, res) => {
    try {
        errorMsg(await TeacherValidation(req.obj))
        const id = req.query.id
        if (!id) throw new Error('Student ID not found')
        const queryObj = [
            { $match: { _id: mongoose.Types.ObjectId(id), role: 'student' } },
            {
                $lookup: {
                    from: 'results',
                    let: { user_id: '$_id' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$$user_id', '$studentId'] }, resultStatus: 'Declared' } }
                    ],
                    as: 'Result'
                }
            },
            { $project: { _id: 1, name: 1, email: 1, Result: 1 } }
        ]
        const studentDataObject = await UserData.aggregate(queryObj);
        return res.json({ statusCode: 200, message: "Student data show successfully", data: studentDataObject })
    } catch (error) {
        return res.json({ statusCode: 500, message: error.message, data: null })
    }

}

const VerifiedStudentController = async (req, res) => {
    try {
        errorMsg(await TeacherValidation(req.obj))
        const StudentData = await UserData.find({ role: 'student', status: 'Active' }, { _id: 1, name: 1, email: 1, status: 1 });
        const count = await UserData.find({ role: 'student', status: 'Active' }).count();
        return res.json({ statusCode: 200, message: "Verified Student data show successfully", data: StudentData, count })
    } catch (error) {
        return res.json({ statusCode: 500, message: error.message, data: null })
    }
}

const CreateExamController = async (req, res) => {
    try {
        const TeacherMail = req.obj
        errorMsg(await TeacherValidation(TeacherMail))
        const { subjectName, questions, notes } = req.body

        const CheckedExam = await ExamChecker(subjectName) //Check Email in Database
        if (CheckedExam) throw new Error('Exam already Created')

        if (questions.length !== 15) throw new Error('Your Exam Paper is not have 15 Questions')
        const ExamObject = await ExamsData.create({ subjectName, questions, notes, email: TeacherMail })
        return res.json({ statusCode: 200, message: "Exam Created", data: ExamObject })
    } catch (error) {
        return res.json({ statusCode: 500, message: error.message, data: null })
    }
}

const viewExamController = async (req, res) => {
    try {
        const TeacherMail = req.obj
        errorMsg(await TeacherValidation(TeacherMail))
        const examObject = await ExamsData.find({ email: TeacherMail, status: true })
        return res.json({ statusCode: 200, message: "View exam successfully", data: examObject })
    } catch (error) {
        return res.json({ statusCode: 500, message: error.message, data: null })
    }
}

const examDetailController = async (req, res) => {
    try {
        const TeacherMail = req.obj
        errorMsg(await TeacherValidation(TeacherMail))
        const id = req.query.id
        if (!id) throw new Error('Exam ID not found')
        const examObject = await ExamsData.findOne({ _id: id, email: TeacherMail, status: true }, { questions: { question: 1, options: 1 }, _id: 0 })
        if (!examObject) throw Error("Exam Not Found")
        return res.json({ statusCode: 200, message: "View exam detail successfully", data: examObject })
    } catch (error) {
        return res.json({ statusCode: 500, message: error.message, data: null })
    }
}

const editExamController = async (req, res) => {
    try {
        const TeacherMail = req.obj
        errorMsg(await TeacherValidation(TeacherMail))
        const id = req.query.id
        if (!id) throw new Error('Exam ID not found')
        const { subjectName, questions, notes } = req.body
        const obj = {}
        if (subjectName) obj.subjectName = subjectName
        if (questions) obj.questions = questions
        if (notes) obj.notes = notes
        const examObject = await ExamsData.findOneAndUpdate({ _id: id, email: TeacherMail }, { $set: obj }, { new: true })
        if (!examObject) throw Error('Exam not Found')
        return res.json({ statusCode: 200, message: "Edit exam successfully", data: examObject })
    } catch (error) {
        return res.json({ statusCode: 500, message: error.message, data: null })
    }
}

const deleteExamController = async (req, res) => {
    try {
        const TeacherMail = req.obj
        errorMsg(await TeacherValidation(TeacherMail))
        const id = req.query.id
        if (!id) throw new Error('Exam ID not found')
        const examObject = await ExamsData.findOne({ _id: id, email: TeacherMail })
        examObject.status = false
        await examObject.save()
        return res.json({ statusCode: 200, message: "Delete exam successfully", data: examObject })
    } catch (error) {
        return res.json({ statusCode: 500, message: error.message, data: null })
    }
}

module.exports = { StudentDataController, VerifiedStudentController, viewStudentDetailController, CreateExamController, viewExamController, examDetailController, editExamController, deleteExamController }