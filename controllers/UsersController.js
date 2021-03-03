const { UserData } = require('../models/UsersModel')
const { validate } = require('express-validation')
const { TokenGenerate } = require('../Config/Authentication')
const { SendMail, MailLink } = require('../Util/Mail')
const { UsersValidation, EmailChecker } = require('../Config/UsersValidation')
const bcrypt = require('bcrypt');
const { verify } = require('jsonwebtoken')
saltRounds = 10;
const SignUp = async (req, res) => {
    try {
        const { name, email, password, role } = req.body

        const CheckedEmail = await EmailChecker(email) //Check Email in Database
        if (CheckedEmail) throw new Error('Email already exist')
        userPassword = await bcrypt.hash(password, saltRounds);
        userRole = role.toLowerCase();
        const UserObj = await UserData.create({ name, email, password: userPassword, role: userRole }) //Insert Data
        const UserToken = TokenGenerate(email) //Generate Token
        UserObj.token = UserToken //Add token
        const VerificationCode = email + Math.floor(100000 + Math.random() * 900000) + password
        UserObj.VerifyCode = VerificationCode
        await UserObj.save() //Save Data
        //Sending Verification Mail in Mailbox
        const VerificationLink = MailLink({ req: process.env.BACKEND_MAIl_URL + "/users", api: 'Verify', code: UserObj.token }) //Link Create
        const VerificationFile = './views/VerificationMail.ejs'
        const UserDetailObject = { name: name, VerifyCode: VerificationLink }
        const MailSubject = "Account Verification"
        const MailText = "Please Verify Your Account"
        const MailDetailObject = { UserDetails: UserDetailObject, email: email, file: VerificationFile, subject: MailSubject, text: MailText }
        SendMail(MailDetailObject) //Call SendMail Function
        delete UserObj.token;
        delete UserObj.password;
        delete UserObj.status;
        return res.json({ statusCode: 200, message: "Sign Up Successfully", data: { name: UserObj.name, email: UserObj.email, role: UserObj.role, id: UserObj._id } })
    } catch (error) {
        return res.json({ statusCode: 500, message: error.message, data: null })
    }
}

//Verification Controller
const VerificationController = async (req, res) => {
    try {
        const token = req.query.token
        let UserObj = await UserData.findOne({ token })
        if (!UserObj) throw new Error('Verification Failed')
        UserObj.status = "Active"
        await UserObj.save()
        return res.render('VerifiedMail', { email: UserObj.email, status: UserObj.status })
    } catch (error) {
        return res.json({ statusCode: 500, message: error.message, data: null })
    }
}

//Login Controller
const LoginController = async (req, res) => {
    try {
        const { email, password } = req.body
        const UserObj = await UserData.findOne({ email })
        if (!UserObj) throw new Error("Invalid email")
        if (UserObj.status === "Pending") throw new Error("Please Verify Email")
        const comparePassword = await bcrypt.compare(password, UserObj.password)
        if (!comparePassword) throw new Error("Invalid Password")
        const UserToken = TokenGenerate(UserObj.email, UserObj._id)
        UserObj.token = UserToken
        await UserObj.save()
        return res.json({ statusCode: 200, message: "Login successful", data: { token: UserToken, name: UserObj.name, email: UserObj.email, role: UserObj.role } })
    } catch (error) {
        return res.json({ statusCode: 500, message: error.message, data: null })
    }
}

//Forgot Password Controller
const ForgotPasswordController = async (req, res) => {
    try {
        const { email } = req.body
        const UserObject = await UserData.findOne({ email })  //Find Email in Database
        if (!UserObject) throw new Error('User not found')
        if (UserObject.status !== 'Active') throw new Error('Please Verify your email')
        const MailSubject = "Forgot Password"   //Mail Subject
        const MailText = "Forgot Old Password and Generate New Password" //Mail Text
        const verifyCode = TokenGenerate(UserObject.email);
        UserObject.VerifyCode = verifyCode;
        await UserObject.save();
        const ForgotPasswordLink = MailLink({ req: process.env.FRONTEND_URL, api: 'newPassword', code: verifyCode })
        const ForgotPasswordFile = './views/ForgotPassword.ejs'
        const UserDetailObject = { name: UserObject.name, link: ForgotPasswordLink }
        const MailObject = { email: UserObject.email, file: ForgotPasswordFile, UserDetails: UserDetailObject, subject: MailSubject, text: MailText } // Mail Detail Object
        SendMail(MailObject)    //Call SendMail Function
        return res.json({ statusCode: 200, message: "Email Send Successfully", data: UserObject.email })
    } catch (error) {
        return res.json({ statusCode: 500, message: error.message, data: null })
    }

}

//Forgot Password Verify 
const ForgotPasswordVerifyController = async (req, res) => {
    try {
        const token = req.query.token
        const { Password, ConfirmPassword } = req.body
        if (Password !== ConfirmPassword) throw new Error("Password Not Matched")
        const UserObject = await UserData.findOne({ token })
        if (!UserObject) throw new Error('Invalid Email')
        const userPassword = await bcrypt.hash(Password, saltRounds);
        UserObject.password = userPassword
        await UserObject.save()
        return res.json({ statusCode: 200, message: "Forgot Password Successfully", data: { name: UserObject.name, email: UserObject.email, id: UserObject._id } })
    } catch (error) {
        return res.json({ statusCode: 500, message: error.message, data: null })
    }
}

const ResetPasswordController = async (req, res) => {
    try {
        const UserEmail = req.obj
        const { oldPassword, Password, ConfirmPassword } = req.body
        if (Password !== ConfirmPassword) throw new Error("Confirm Password Not Matched")
        const UserObject = await UserData.findOne({ email: UserEmail })
        const comparePassword = await bcrypt.compare(oldPassword, UserObject.password)
        if(!comparePassword) throw new Error("Invalid Old Password");
        const userPassword = await bcrypt.hash(Password, saltRounds);
        UserObject.password = userPassword
        await UserObject.save()
        return res.json({ statusCode: 200, message: "Reset Password Successfully", data: { name: UserObject.name, email: UserObject.email, id: UserObject._id } })
    } catch (error) {
        return res.json({ statusCode: 500, message: error.message, data: null })
    }
}

module.exports = { SignUp, VerificationController, LoginController, ForgotPasswordController, ForgotPasswordVerifyController, ResetPasswordController }