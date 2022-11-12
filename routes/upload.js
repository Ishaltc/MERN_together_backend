const express = require('express');
const { uploadImages ,listImages } = require('../controllers/upload');
const { authUser } = require('../middlewares/auth');
const {imageUpload}  = require('../middlewares/imageUpload');

const router = express.Router();
 
// for uploading images to the cloudinary
 router.post("/uploadImages",imageUpload, uploadImages)

 // getting images from the cloudinary
router.post("/listImages",authUser,listImages)








module.exports = router;