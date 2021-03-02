const mongoose = require('mongoose')
const questionsSchema = new mongoose.Schema({
    question: { type: String, required: true },
    answer: { type: String, required: true },
    options: [String]
})

const ExamsSchema = new mongoose.Schema({
    subjectName: { type: String, required: true },
    questions: [questionsSchema],
    notes: [String],
    email: { type: String },
    status: { type: Boolean, default: true },

}, { collection: 'exams' })

const examPapersSchema = new mongoose.Schema({
    subjectId: { type: mongoose.Schema.Types.ObjectId, required: true },
    questions: [],
    studentId: { type: mongoose.Schema.Types.ObjectId, required: true },
    isPaperGenerated: { type: Boolean, default: true },
    isExamCompleted: { type: Boolean, default: false },

}, { collection: 'examPapers' })

module.exports.ExamsData = mongoose.model('exams', ExamsSchema)
module.exports.examPapersData = mongoose.model('examPapers', examPapersSchema)