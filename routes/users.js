const express = require('express');
const { validate, ValidationError } = require('express-validation');
const { TokenVerify } = require('../Config/Authentication');
const { UsersValidation, loginValidation, forgotPasswordEmailValidation, newPasswordValidation, resetPasswordValidation } = require('../Config/UsersValidation')
const { SignUp, VerificationController, LoginController, ForgotPasswordController, ForgotPasswordVerifyController, forgotPasswordTokenController, ResetPasswordController } = require('../controllers/UsersController')
var router = express.Router();

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});
router.post('/SignUp', validate(UsersValidation), SignUp)
router.get('/Verify', VerificationController)
router.post('/Login', validate(loginValidation), LoginController)
router.post('/ForgotPassword', validate(forgotPasswordEmailValidation), ForgotPasswordController)
router.get('/newPassword', TokenVerify, forgotPasswordTokenController)
router.post('/ForgotPassword/Verify', validate(newPasswordValidation), ForgotPasswordVerifyController)
router.post('/ResetPassword', TokenVerify, validate(resetPasswordValidation), ResetPasswordController)

router.use((err, req, res, next) => {
  if (err instanceof ValidationError) {
    return res.status(err.statusCode).json(err)
  }
  return res.status(500).json(err)
})
module.exports = router;
