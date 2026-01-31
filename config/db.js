require("dotenv").config()
const mongoose = require('mongoose')

module.exports=()=>
{
    mongoose.connect(process.env.DB_URL)
        .then(() => {
            console.log("Database connected");
        })
        .catch((err) => {
            console.log("Database connection error:", err);
        });
}