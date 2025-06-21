const {validationResult , matchedData} = require("express-validator")
exports.validate = async (req , res , next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors : errors.array()})
    }
    req.data = matchedData(req);
    next();
}
