'use strict';
//*     /api/search

const router = require('express').Router();
const verifyToken = require('../controllers/auth.controller').verifyToken;  //import middleware to authenticate apis

const searchController = require('../controllers/search.controller');

//*     /api/search/:keywords
router.get('/:keywords', verifyToken, searchController.search);

module.exports = router;
