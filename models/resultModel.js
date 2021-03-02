const mongoose = require('mongoose')
const resultsSchema = new mongoose.Schema({
    score: { type: Number },
    subjectName: { type: String, ref: 'exams' },
    studentAnswer: [],
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    rank: { type: Number, default: 0 },
    resultStatus: { type: String }
}, { collection: 'results' })

module.exports.resultsData = mongoose.model('results', resultsSchema)