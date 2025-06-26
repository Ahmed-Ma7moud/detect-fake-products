const { body } = require("express-validator")

const roles = ["manufacturer" , "pharmacy" , "supplier" , "admin" , "user"]


exports.registerValidation = [
    body('firstName')
    .optional()
    .trim()
    .matches(/^[a-zA-Z]{3,15}$/)
    .withMessage("firstName must comtains only letters and length 3-15 chars")
    .escape(),
    
    body('lastName')
    .optional()
    .trim()
    .matches(/^[a-zA-Z]{3,15}$/)
    .withMessage("lastName must comtains only letters and length 3-15 chars")
    .escape(),
    
    body('tradeName')
    .optional()
    .trim()
    .matches(/^[\w\s~!#$%&-\*]{2,50}$/)
    .withMessage("trade name has invalid chars or length should between 2-50 chars")
    .escape(),

    body('location')
    .optional()
    .trim()
    .matches(/^[\w,-\s]{2,50}$/)
    .withMessage("location has invalid chars or length should between 2-50 chars")
    .escape(),

    body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please write valid email")
    .normalizeEmail(),

    body("password")
    .trim()
    .isStrongPassword({
        minLowercase : 1,
        minUppercase : 1,
        minNumbers : 1,
        returnScore : false
    })
    .withMessage("password should has at least one small and capital letter and a digit")
    .matches(/^[\w!~@#$%&-\*]{8,30}$/)
    .withMessage("letters numbers and !~@#$%&* chars , length 8 - 30"),

    body("role")
    .trim()
    .isIn(roles)
    .withMessage("invalid role => user , manufacturer , pharmacy , supplier and admin"),

    body('age')
    .isInt({ min : 10 , max : 150})
    .withMessage("age must be intiger between 10 - 150 years old")
]

exports.loginValidation = [
    body("email")
    .trim()
    .notEmpty()
    .withMessage("email is required")
    .isEmail()
    .withMessage("invalid email")
    .normalizeEmail(),

    body("password")
    .trim()
    .notEmpty()
    .withMessage("password is required")
    .escape(),

    body("otp")
    .optional()
    .matches(/^\d{6}$/)
    .withMessage("invalid otp number")
]