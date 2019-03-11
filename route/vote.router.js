'use strict';
//*     /api/vote

const router = require('express').Router();
const verifyToken = require('../controllers/auth.controller').verifyToken;  //import middleware to authenticate apis

const voteController = require('../controllers/vote.controller');

//*     /api/vote
router.post('/', verifyToken, voteController.setVote);

router.get('/:postid', verifyToken, voteController.getVotes);

module.exports = router;