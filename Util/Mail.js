const nodemailer = require('nodemailer')
const ejs = require('ejs')

const SendMail = async (mail) => {
    try {
        ejs.renderFile(mail.file, mail.UserDetails, async (err, data) => {
            if (err) {
                throw Error(err.message)
            } else {
                const transport = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.SENDER_MAIL,
                        pass: process.env.SENDER_PASSWORD,
                    }
                })
                await transport.sendMail({
                    from: process.env.SENDER_MAIL,
                    to: mail.email,
                    subject: mail.subject,
                    text: mail.text,
                    html: data
                })
                console.log('Email Send Successfully');
            }
        })
    } catch (error) {
        throw error;
    }
}

const MailLink = (detail) => {
    return detail.req + '/' + detail.api + '?token=' + detail.code;
    // return process.env.FRONTEND_URL + '/users/'+detail.api+'?id=' + detail.code;
}

// const ForgotPasswordMailInfo = ()=>{
//     const ForgotPasswordLink = MailLink('Verify', UserObj.VerifyCode) //Link Create
//     const ForgotPasswordVerificationFile = './views/VerificationMail.ejs'
//     const UserDetailObject = { name: name, email: email, VerifyCode: VerificationLink }
//     const MailSubject = "Forgot Password"   //Mail Subject
//     const MailText = "Forgot Old Password and Generate New Password" //Mail Text
// }

module.exports = { SendMail, MailLink }