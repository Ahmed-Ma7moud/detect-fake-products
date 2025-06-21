const {body , param} = require("express-validator")

function validateText (field , regex = /^[\w\s]{2,50}$/){
    const validator = (field === "id")?param(field) : body(field)
    return validator
           .trim()
           .notEmpty()
           .withMessage("this field is requried")
           .isString()
           .withMessage("this field must be a string")
           .matches(regex)
           .withMessage("use letters numbers space within range 2 - 50 chars")
           .escape()
}

exports.addProductValidation = [
    validateText("name"),
    validateText("serial_number" , /^[\w]{2,50}$/),
    validateText("batch_number" , /^[\w]{2,50}$/),
    body("price")
    .isNumeric()
    .withMessage("Price must be number")
    .custom((value)=>{
        if(value > 0 && value < 10000000)
            return true;
        throw new Error ("this number is out of limits")
    })
]

// id here represent serial or batch number
exports.idValidation = [
    validateText("id" , /^[\w]{2,50}$/)
]