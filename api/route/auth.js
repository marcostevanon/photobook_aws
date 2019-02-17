'use strict';
var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
const auth = require('../../config/auth.config');

/**
 * This function is used as middleware to authenticate api calls to this server
 */
function verifyToken(req, res, next) {
  console.log(`${new Date().toISOString()} ${req.method}\t${req.originalUrl}\t${JSON.stringify(req.body)}`);

  // check header for token
  var token = req.headers['x-access-token'];

  //if token is not provided send 403 not authorized
  if (!token)
    return res.status(403).send({ error: { status: 403, message: 'No token provided' } });

  // verifies secret and checks exp
  jwt.verify(token, auth.secret, (err, decoded) => {
    if (err)
      return res.status(401).send({ error: { status: 401, message: 'Failed to authenticate token' } });

    req.token = { id: decoded.id, username: decoded.username };
    next();
  });
};

module.exports = verifyToken;