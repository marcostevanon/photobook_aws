'use strict';

const jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
const bcrypt = require('bcrypt-nodejs');

// import modules to query postgresql
const { Client: PgClient } = require("pg");
const pg_options = require('../config/pg.config');

const auth = require('../config/auth.config');

// This function is used as middleware to authenticate api calls to this server
function verifyToken(req, res, next) {

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

}

async function login(req, res) {

  const pg_client = new PgClient(pg_options);
  const query = `SELECT * FROM tsac18_stevanon.users WHERE username = $1;`;
  const user = req.body.username;
  const pass = req.body.password;

  pg_client.connect()

    // check if user exists
    .then(() => pg_client.query(query, [user]).then(r => r.rows))
    .then(table => {
      pg_client.end();

      if (!table.length)
        return res.status(400).json({ message: `User '${user}' does not exist` });

      // if the user is found but check the password
      if (!bcrypt.compareSync(pass, table[0].password))
        return res.status(401).json({ message: "Password not valid" });

      // if user is found and password is valid
      // create a token
      var token = jwt.sign(
        { id: table[0].id, username: table[0].username },
        auth.secret,
        { expiresIn: 60 * 60 * parseInt(auth.DEF_TOKEN_EXPIRE) }
      );

      // return the information including token as JSON
      res.status(200).json({
        message: "Authorized",
        status: 200,
        token,
        expiresIn: 60 * 60 * parseInt(auth.DEF_TOKEN_EXPIRE),
        user: { id: table[0].id, username: table[0].username, avatar: table[0].avatar }
      });
      console.log(`Token request by: ${user} - Granted`);
    })
    .catch(err => {
      console.log(err);
      return res.status(500).json({ message: "Internal Error" });
    });
}

async function registration(req, res) {

  const firstname = req.body.firstname;
  const lastname = req.body.lastname;
  const email = req.body.email;
  const username = req.body.username;
  const password = bcrypt.hashSync(req.body.password);
  const avatar = req.body.avatar;

  if (!firstname || !email || !username || !password)
    return res.sendStatus(400);

  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (!re.test(String(email).toLowerCase()))
    return res.status(400).send('email not valid');

  const pg_client = new PgClient(pg_options);
  const query = `INSERT INTO tsac18_stevanon.users (firstname, lastname, email, username, password, avatar) VALUES ($1, $2, $3, $4, $5, $6)`;

  pg_client.connect()
    .then(() => pg_client.query(query, [firstname, lastname ? lastname : null, email, username, password, avatar ? avatar : null]))
    .then(result => {
      if (result.rowCount > 0) {
        res.sendStatus(204);
        console.log('User registration - ' + JSON.stringify({ firstname, lastname, email, username }));
      }
      else res.status(400).send('username already exist');
    })
    .then(() => pg_client.end())
    .then(() => { require('../workers/elastic-search.worker').updateUsersIndeces() })
    .catch(err => {
      res.status(400).send('username already exist');
      console.log(err);
    });
}

module.exports = { verifyToken, login, registration }