const express = require("express")
const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const app = express()
const jwt = require("jsonwebtoken")

app.use(express.json()) 
const secretCode = "mdsnwmdjncincjdehfunmcneidnzmnsidjnnjs"

mongoose.connect("mongodb://localhost:27017/test-rms-db")
    .then(() => { console.log("database connected") })
    .catch((err) => { console.log(err) })

//user creation
const userSchema = mongoose.Schema({
    name: String,
    email: String,
    role: String,
    age: Number,
    password: String
})
const User = mongoose.model("User", userSchema)

app.post('/users/signup', async (req, res) => {
    
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

app.post("/users/login",async (req,res) => {
   /* if(!req.body){
        return res.json({"message":"invalid request body"})
    }
    
    const email = req.body.email
    const password = req.body.password
    
    if(!email){
        return res.json({"message":"email is required"})
    }
    */
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
        secretCode,
        {expiresIn:"1h"}

    )
    return res.json({message:"login successful",token : token})
}catch(err){
    console.log(err)
    return res.json({"message":"server error"})
}

})
app.listen(4000)