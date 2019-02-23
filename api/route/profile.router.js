'use strict';
//*     /api/profile

const router = require('express').Router();
const verifyToken = require('../controllers/auth.controller').verifyToken;  //import middleware to authenticate apis

const profileController = require('../controllers/profile.controller');

//*     /api/profile/:id
router.get('/:userid', verifyToken, profileController.getProfileById)

//*     /api/profile/:id/images
router.get('/:userid/images', verifyToken, profileController.getImageByProfileId)

module.exports = router;