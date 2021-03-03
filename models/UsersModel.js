const mongoose = require('mongoose')

const UsersSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, required: true },
    token: { type: String, default: null },
    verifyCodeToken: { type: String },
    status: { type: String, default: "Pending" }
}, { collection: 'users' })

module.exports.UserData = mongoose.model('users', UsersSchema)