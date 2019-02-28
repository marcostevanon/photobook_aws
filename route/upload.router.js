'use strict';
//*     /api/upload

let router = require('express').Router();
const verifyToken = require('../controllers/auth.controller').verifyToken;  //import middleware to authenticate apis

// import modules to upload files on AWS S3
const multer = require('multer');
var upload = multer({ storage: multer.memoryStorage() });

const uploadController = require('../controllers/upload.controller');

//*     /api/upload
router.post('/', verifyToken, upload.single("image"), uploadController.uploadImage);

//*     /api/upload/check/:photo_id
router.get('/check/:photo_id', verifyToken, uploadController.checkUploadedPhoto)

//*     /api/upload/cognitive
router.post('/cognitive', verifyToken, uploadController.useCognitiveService)

module.exports = router;