const express = require('express');
const { message, getMessages } = require('../controllers/message');
const router = express.Router();


router.post("/message",message)
router.get("/getMessages/:conversationId",getMessages)


module.exports = router;