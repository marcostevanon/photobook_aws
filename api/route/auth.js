var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
const auth = require('../config/auth.config');

function verifyToken(req, res, next) {
  console.log(JSON.stringify({
    date: new Date().toISOString(),
    method: req.method,
    route: req.originalUrl,
    params: req.params,
    query: req.query,
    body: req.body
  }));
  // check header or url parameters or post parameters for token
  var token = req.headers['x-access-token'];
  if (!token)
    return res.status(403).send({
      error: {
        status: 403,
        message: 'No token provided'
      }
    });

  // verifies secret and checks exp
  jwt.verify(token, auth.secret, (err, decoded) => {
    if (err)
      return res.status(401).send({
        error: {
          status: 401,
          message: 'Failed to authenticate token'
        }
      });

    req.token = {
      id: decoded.id,
      username: decoded.username
    };
    next();
  });
};

module.exports = verifyToken;