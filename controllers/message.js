const Message = require("../models/Message");

exports.message = async (req, res) => {
  try {
  
    const newMessage = await new Message(req.body).save();
    res.status(200).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//get message
exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find({
     
conversationId: req.params.conversationId,
    });
    res.status(200).json(messages)
    //console.log(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};