const jwt = require('jsonwebtoken')
const { UserData } = require('../models/UsersModel')
//Token Generate
const TokenGenerate = (email, _id, expiresIn = 3600) => {
    return jwt.sign({ email, _id }, process.env.JWT_SECRET_KEY, { expiresIn });
}

const TokenVerify = async (req, res, next) => {
    try {
        const token = req.headers['access-token']
        if (!token) throw Error('Token not provided.')
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY)
        if (decoded?._id) {
            const userData = await UserData.findOne({ _id: decoded._id }).lean().exec();
            if (userData) {
                req.obj = decoded.email
                next();
            }
            else {
                throw new Error('Invalid user')
            }
        }
        else {
            throw new Error('Invalid token')
        }
    } catch (error) {
        return res.json({ statusCode: 401, message: error.message, data: null })
    }

}

module.exports = { TokenGenerate, TokenVerify }