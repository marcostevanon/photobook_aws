/**
 *  /api/auth
 */

'use strict';
const router = require('express').Router();

const bcrypt = require('bcrypt-nodejs');
const jwt = require('jsonwebtoken');
const auth_options = require('../config/auth.config');

// import modules to query postgresql
const { Client } = require("pg");
const pg_options = require('../config/pg.config');

// /api/auth/login
router.post('/login', async (req, res) => {
    console.log(`${new Date().toISOString()} ${req.method}\t${req.originalUrl}\t${JSON.stringify(req.body)}`);

    const client = new Client(pg_options);
    const query = `SELECT * FROM tsac18_stevanon.users WHERE username = $1;`;
    const user = req.body.username;
    const pass = req.body.password;

    try {
        await client.connect();
        
        // check if user exists
        var result = await client.query(query, [user]).then(r => r.rows);
        await client.end();

        if (!result.length)
            return res.status(400).json({ error: { status: 400, message: `Unable to found user: ${user}`, token: null } });

        // if the user is found but check the password
        if (!bcrypt.compareSync(pass, result[0].password))
            return res.status(401).json({ error: { status: 401, message: "Login information provided are not valid: unable to provide a token", token: null } });

        // if user is found and password is valid
        // create a token
        var token = jwt.sign(
            { id: result[0].id, username: result[0].username },
            auth_options.secret,
            { expiresIn: 60 * 60 * parseInt(auth_options.DEF_TOKEN_EXPIRE) }
        );

        // return the information including token as JSON
        res.status(200).json({ message: "Authorized", token, user: { id: result[0].id, username: result[0].username } });
        console.log(`Token request by: ${user} - Granted`);

    } catch (err) {
        return res.status(500).json({ error: { status: 500, message: "Unable to provide a valid token, Internal Error", token: null } });
    }
});

// /api/auth/signup
router.post('/signup', async (req, res) => {

    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    if (!username || !email || !password)
        return res.status(400).json({ error: { status: 400, message: `Request body not valid` } });

    const client = new Client(pg_options);
    const query = `INSERT INTO tsac18_stevanon.users (username, email, password) VALUES ($1, $2, $3)`;

    try {
        await client.connect();
        var result = await client.query(query, [username, email, password]);
        if (result.rowCount > 0)
            res.sendStatus(204);
        else {
            console.log(result);
            res.status(400).json({ error: { status: 400, message: `User already exist` } })
        }
    } catch (err) {
        console.log(err);
        res.status(400).json({ error: { status: 400, message: `User already exist` } })
    }
});

module.exports = router;