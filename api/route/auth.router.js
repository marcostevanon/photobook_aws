/**
 *  /api/auth
 */

'use strict';
const router = require('express').Router();

const bcrypt = require('bcrypt-nodejs');
const jwt = require('jsonwebtoken');
const auth_options = require('../../config/auth.config');

// import modules to query postgresql
const { Client } = require("pg");
const pg_options = require('../../config/pg.config');

// /api/auth/login
router.post('/login', async (req, res) => {
    console.log(`${new Date().toISOString()} ${req.method}\t${req.originalUrl}\t${JSON.stringify(req.body)}`);
    console.time('/api/auth/login');

    const pg_client = new Client(pg_options);
    const query = `SELECT * FROM tsac18_stevanon.users WHERE username = $1;`;
    const user = req.body.username;
    const pass = req.body.password;

    pg_client.connect()

        // check if user exists
        .then(() => pg_client.query(query, [user]).then(r => r.rows))
        .then(table => {
            console.log(table);
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
                auth_options.secret,
                { expiresIn: 60 * 60 * parseInt(auth_options.DEF_TOKEN_EXPIRE) }
            );

            // return the information including token as JSON
            res.status(200).json({
                message: "Authorized",
                status: 200,
                token,
                expiresIn: 60 * 60 * parseInt(auth_options.DEF_TOKEN_EXPIRE),
                user: { id: table[0].id, username: table[0].username, avatar: table[0].avatar }
            });
            console.log(`Token request by: ${user} - Granted`);
            console.timeEnd('/api/auth/login');
        })
        .catch(err => {
            console.log(err);
            return res.status(500).json({ message: "Internal Error" });
        });
});

// /api/auth/signup
router.post('/signup', async (req, res) => {


    const firstname = req.body.firstname;
    const lastname = req.body.lastname;
    const email = req.body.email;
    const username = req.body.username;
    const password = req.body.password;

    if (!firstname || !email || !username || !password)
        return res.status(400).send('Request not valid');

    const pg_client = new Client(pg_options);
    const query = `INSERT INTO tsac18_stevanon.users (firstname, lastname, email, username, password) VALUES ($1, $2, $3, $4, $5)`;

    pg_client.connect()
        .then(() => pg_client.query(query, [firstname, lastname ? lastname : null, email, username, password]))
        .then(result => {
            if (result.rowCount > 0) res.sendStatus(204);
            else res.status(400).send('User already exist');
        }).then(() => pg_client.end())
        .catch(err => {
            res.status(400).send('User already exist');
            console.log(err);
        });
});

module.exports = router;