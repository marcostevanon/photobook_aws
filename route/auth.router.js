'use strict';
//*     /api/auth

const router = require('express').Router();
const authController = require('../controllers/auth.controller')

//*     /api/auth/login
router.post('/login', authController.login);

//*     /api/auth/signup
router.post('/signup', authController.registration);

module.exports = router;