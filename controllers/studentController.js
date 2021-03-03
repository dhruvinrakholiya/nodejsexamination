const { TeacherValidation, studentValidation, ExamChecker, examPaperRandom } = require('../Config/UsersValidation');
const { ExamsData, examPapersData } = require('../models/examModel');
const { UserData } = require('../models/UsersModel')
const { resultsData } = require('../models/resultModel')
const cron = require('node-cron');
const { SendMail } = require('../Util/Mail');
const { Schema } = require('mongoose');

const errorMsg = (value) => {
    if (value != true) throw Error(value)
}

//Calculate Rank and Update
const updateRank = async () => {
    //Aggregate Query
    const rankObject = [
        { $sort: { score: -1 } },
        { $group: { _id: '$subjectName', data: { $push: '$$ROOT' } } },
        { $unwind: { path: '$data', includeArrayIndex: 'rank' } },
        { $project: { _id: '$data._id', rank: { $add: ['$rank', 1] } } }
    ]
    const resultObject = await resultsData.aggregate(rankObject)
    //Update Rank
    const rankUpdateData = resultObject.map(async (dataObject) => {
        await resultsData.findOneAndUpdate({ _id: dataObject._id }, { $set: { rank: dataObject.rank } }, { new: true })
    })
}

//Result Declared with Mail Function
const resultDetailTask = (details) => {
    const MailSubject = "Result Declared"
    const MailText = "Your Result is Declared"
    const resultFile = './views/resultDeclared.ejs'
    const resultDetail = { name: details.name, score: details.score, subjectName: details.subjectName }
    const MailDetailObject = { UserDetails: resultDetail, email: details.email, file: resultFile, subject: MailSubject, text: MailText }

    //Cron Job
    const taskTime = cron.schedule('59 * * * * *', async () => {
        const resultObject = await resultsData.findOne({ subjectName: details.subjectName, studentId: details.studentId })
        resultObject.resultStatus = "Declared"
        await resultObject.save()
        updateRank()
        SendMail(MailDetailObject)
        taskTime.stop();
    }, {
        scheduled: false
    })
    taskTime.start()
}

//Show All Exam and Result
const studentExamController = async (req, res) => {
    try {
        errorMsg(await studentValidation(req.obj))

        const UsersObject = await UserData.findOne({ email: req.obj }, { _id: 1 })
        const usersID = UsersObject._id
        const obj = [
            { $match: { status: true } },
            { $project: { subjectName: 1, notes: 1, email: 1 } },
            {
                $lookup: {
                    from: 'results',
                    let: { subject: '$subjectName' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$$subject', '$subjectName'] }, resultStatus: 'Declared', studentId: usersID } }
                    ],
                    as: 'Result'
                }
            },
            { $project: { 'Result.studentAnswer': 0, 'Result.studentId': 0, 'Result.__v': 0 } }
        ]
        const studentObject = await ExamsData.aggregate(obj)

        return res.json({ statusCode: 200, message: "View exam successfully", data: studentObject, userId: usersID })
    } catch (error) {
        return res.json({ statusCode: 500, message: error.message, data: null })
    }
}

//Student Profile Detail
const studentProfileController = async (req, res) => {
    try {
        errorMsg(await studentValidation(req.obj))
        const { name } = req.body
        const obj = {}
        if (name) obj.name = name
        const studentObject = await UserData.findOneAndUpdate({ email: req.obj }, { $set: obj }, { new: true })

        return res.json({ statusCode: 200, message: "View student profile successfully", data: { name: studentObject.name, email: studentObject.email, id: studentObject._id } })
    } catch (error) {
        return res.json({ statusCode: 500, message: error.message, data: null })
    }
}

//Student give exam
const giveExamController = async (req, res) => {
    try {
        errorMsg(await studentValidation(req.obj))

        const subjectId = req.query.id
        const studAnsArray = req.body
        if (!subjectId) throw new Error('Subject ID not found')
        const userObject = await UserData.findOne({ email: req.obj })
        const studentId = userObject._id
        let examDetail = await ExamsData.findOne({ _id: subjectId })
        if (!examDetail) throw Error('Invalid SubjectId')
        const resultDetail = await resultsData.findOne({ studentId: studentId, subjectName: examDetail.subjectName })
        if (resultDetail) throw Error('You can not give exam again')
        let examPaper = await examPapersData.findOne({ studentId, subjectId, isPaperGenerated: true })
        const answerArray = examDetail.questions
        let correctAnswerResult = []
        const checkProperty = (first, second) => {
            const findInDatabase = (questions) => {
                for (let i = 0; i < second.length; i++) {
                    if (second[i]._id == questions.question && second[i].answer === questions.answer) {
                        correctAnswerResult.push(second[i])
                    }
                }
            }
            for (let i = 0; i < first.length; i++) {
                findInDatabase(first[i])
            }
        }
        checkProperty(studAnsArray, answerArray)
        const score = correctAnswerResult.length
        const resultObj = {
            score: score,
            name: userObject.name,
            email: req.obj,
            studentId: studentId,
            subjectName: examDetail.subjectName
        }
        await resultsData.create({ subjectName: examDetail.subjectName, studentAnswer: studAnsArray, score: score, studentId: userObject._id, resultStatus: 'Inprogress' })
        resultDetailTask(resultObj);

        examPaper.isExamCompleted = true;
        await examPaper.save()
        return res.json({ statusCode: 200, message: "Exam finish", data: null })
    } catch (error) {
        return res.json({ statusCode: 500, message: error.message, data: null })
    }
}

//Student Exam Paper
const examPaperController = async (req, res) => {
    try {
        errorMsg(await studentValidation(req.obj))
        const subjectId = req.query.id
        let randomPaper = []
        if (!subjectId) throw new Error('Subject ID not found')
        const userObject = await UserData.findOne({ email: req.obj })
        const studentId = userObject._id

        //Check ExamId
        let examDetail = await ExamsData.findOne({ _id: subjectId })
        if (!examDetail) throw Error('Invalid SubjectId')

        //Check you can give exam
        const resultDetail = await resultsData.findOne({ studentId: studentId, subjectName: examDetail.subjectName })
        if (resultDetail) throw Error('You can not give exam again')

        const examPaperObject = await ExamsData.findOne({ _id: subjectId }, { subjectName: 1, "questions._id": 1, "questions.question": 1, "questions.options": 1, notes: 1 })
        let checkExamPaperGenerated = await examPapersData.findOne({ studentId, subjectId, isPaperGenerated: true })
        if (!checkExamPaperGenerated) {
            const randomExamPaperArray = examPaperRandom(examPaperObject.questions, randomPaper)
            const questionsId = randomExamPaperArray.map((data) => data._id)
            const randomExamPaperObject = {
                subjectId: subjectId,
                questions: questionsId,
                studentId: studentId
            }
            checkExamPaperGenerated = await examPapersData.create(randomExamPaperObject)
        }
        const checkExamPaperQuestions = checkExamPaperGenerated.questions

        const examPaperQuestionId = examPaperObject.questions
        const examDataObject = examPaperQuestionId.filter((data) => {
            data._id = String(data._id);
            return checkExamPaperQuestions.find((value) => String(value) == data._id)
        })
        return res.json({ statusCode: 200, message: "Exam Paper", data: examDataObject })
    } catch (error) {
        return res.json({ statusCode: 500, message: error, data: null })
    }
}

const getStudentProfileController = async (req, res) => {
    try {
        errorMsg(await studentValidation(req.obj))
        const studentObject = await UserData.findOne({ email : req.obj },{_id:1,name:1,email:1,role:1})
        return res.json({ statusCode: 200, message: "get student profile successfully", data: studentObject })
    } catch (error) {
        return res.json({ statusCode: 500, message: error.message, data: null })
    }
}

module.exports = { studentExamController, studentProfileController, giveExamController, examPaperController, getStudentProfileController }