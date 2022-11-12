const { validateEmail } = require("../helpers/validation");
const Admin = require("../models/Admin");
const bcrypt = require("bcrypt");
const { generateAdminToken } = require("../helpers/token");
const User = require("../models/User");
const { response } = require("express");

exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!validateEmail(email)) {
      return res.status(400).json({ message: "invalid email address" });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: "Only admin can join" });
    }
    const check = await bcrypt.compare(password, admin.password);
    if (!check) {
      return res
        .status(400)
        .json({ message: "Invalid credentials.Please try again" });
    }

    const token = generateAdminToken({ id: admin._id.toString() }, "7d");
    res.send({
      id: admin._id,
      email: admin.email,
      token: token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//get all user
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


//blocking a user
 exports.blockUser =async (req,res) => {
  try {
    const {userId} = req.params;

    const user= await User.findById(userId)
    if(user.isBlocked) {
      await user.findOne({$set:{isBlocked:false}})
    }else{
      await user.findOne({$set:{isBlocked:true}})
    }
    res.status
    
  } catch (error) {
    
  }
 }