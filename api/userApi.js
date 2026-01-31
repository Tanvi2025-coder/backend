require("dotenv").config();
const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/userModel');

const jwt = require('jsonwebtoken');
const router = express.Router();


router.post('/signup', async (req, res) => {
    console.log("req.body:",req.body)
    const name = req.body.name
    const email = req.body.email
    const role = req.body.role
    const age = req.body.age
    const password = req.body.password
   
    if(!email || !password ){
        return res.json({"message":"invalid request"})
    }
    
    //validation email
    const userCheck = await User.findOne({email:email})
    console.log("userCheck:",userCheck)
    if(userCheck){
        return res.json({"message":"email is already exist"})
    }
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = new User({
        name: name,
        email: email,
        role: role,
        age: age,
        password: hashedPassword
    })
    await user.save()
    res.json({"message":"success"})
})

router.post("/login",async (req,res) => {
    if(!req.body){
        return res.json({"message":"invalid request body"})
    }
    
    const email = req.body.email
    const password = req.body.password
    
    if(!email){
        return res.json({"message":"email is required"})
    }
    
    const user = await User.findOne({ email:email })
    if(!user){
        return res.json({"message":"email is invaild"})
    }
    const isPasswordMatching  = await bcrypt.compare(password,user.password)
    if(!isPasswordMatching){
        return res.json({"message":"password invaild"})
    }
    try{
    const token = jwt.sign(
        {user: user._id},
        process.env.SECREAT_CODE,
        {expiresIn:"1h"}

    )
    return res.json({message:"login successful",token : token})
}catch(err){
    console.log(err)
    return res.json({"message":"server error"})
}

})

module.exports = router