;
const express = require('express');
const { adminLogin,getAllUsers, blockUser } = require('../admin-Controller/admin');
const { authAdmin } = require('../middlewares/adminAuth');

const router= express.Router()

router.post("/adminLogin",adminLogin);
router.get("/getAllUsers", authAdmin,getAllUsers)
router.put("/blockUser/:userId",authAdmin, blockUser)





module.exports = router;