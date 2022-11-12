const { Router } = require("express");
const express = require("express");
const {
  newConversation,
  getConversation,
  getPartnerData,
 
} = require("../controllers/conversation");
const { authUser } = require("../middlewares/auth");
const router = express.Router();

router.post("/conversations", newConversation);

router.get("/conversations/:userId", getConversation);

router.get("/getPartnerData/:friendId", getPartnerData);



module.exports = router;
