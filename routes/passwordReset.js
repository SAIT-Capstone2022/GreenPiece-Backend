const router = require('express').Router();
const { User } = require('../models/user');
const Token = require('../models/token');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const Joi = require('joi');
const passwordComplexity = require('joi-password-complexity')
const bcrypt = require('bcrypt');
const token = require('../models/token');


// send password link
router.post("/", async(req,res) => {
    try {
        const emailSchema = Joi.object({
            email:Joi.string().email().required().label("Email")
        });
        const {error} = emailSchema.validate(req.body);
        if(error)
        {
            return res.status(400).send({message: error.details[0].message});
        }
        let user = await User.findOne({email: req.body.email});
        if(!user)
        {
            return res.status(409).send({message:"The email you entered does not exist!"});
        }
        let token = await Token.findOne({userId:user._id});
        if(!token){
            token = await new Token({
                userId: user._id,
                token: crypto.randomBytes(32).toString("hex")
            }).save()
        }
        
        const url = `${process.env.BASE_URL}password-reset/${user._id}/${token.token}`;
        await sendEmail(user.email, "Password Reset", `${url} Click this link to reset your password`);

               
        res.status(200).send({message:"A password reset link has been sent to you. Please check your email."})
    } catch (error) {
        res.status(500).send({message: "Internal server error"})
    }
});


// verify url

router.get("/:id/:token", async (req, res) => {
    try {
        const user = await User.findOne({_id:req.params.id});
        if(!user)
        {
            return res.status(400).send({message: "Invalid link"});
        }

        const token = await Token.findOne({
            userId: user._id,
            token: req.params.token
        });

        if(!token)
        {
            return res.status(400).send({message: "Invalid link"})
        }

        res.status(200).send({message: "Valid Url"})
    } catch (error) {
        res.status(500).send({message: "Internal server error"});
    }
})


// reset password

router.post("/:id/:token", async (req, res) => {
    try {
        const passwordSchema = Joi.object({
            password: passwordComplexity().required().label("Password")
        });
        const {error} = passwordSchema.validate(req.body);
        
        if(error)
        {
            return res.status(400).send({message: error.details[0].message});
        }
            
        const user = await User.findOne({_id:req.params.id});

        if(!user)
        {
            return res.status(400).send({message:"Invalid link"})
        }
        const toten = await Token.findOne({
            userId: user._id,
            token: req.params.token,
        });

        if(!token)
        {
            return res.status(400).send({message:"Invalid link"});
        }

        if(!user.verified)
        {
            user.verified = true;
        }

        const salt = await bcrypt.genSalt(Number(process.env.SALT));
        const hashPassword = await bcrypt.hash(req.body.password, salt)

        user.password = hashPassword;
        await user.save();
        await token.remove()

        res.status(200).send({message:"Password reset successful."})
    } catch (error) {
        console.log(error);
        res.status(500).send({message:"Internal server error"})        
    }
})

module.exports = router;