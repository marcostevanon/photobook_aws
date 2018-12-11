//Router AUTH
const router = require('express').Router();

const bcrypt = require('bcrypt-nodejs');
const jwt = require('jsonwebtoken');
const verifyToken = require('./auth');
const auth = require('../config/auth.config');

const { Client } = require("pg");

router.post('/login', async (req, res) => {
    const client = new Client(require('../config/pg.config'));
    await client.connect();

    const db_query = `SELECT * FROM tsac18_stevanon.users WHERE username = $1;`,
        user = req.body.username,
        pass = req.body.password;

    console.log(JSON.stringify({
        date: new Date().toISOString(),
        method: req.method,
        route: req.originalUrl,
        params: req.params,
        query: req.query,
        body: req.body
    }));

    try {
        var result = await client.query(db_query, [user]);
        result = result.rows;
        await client.end();

        // check if user exists
        if (!result.length)
            return res.status(400).json({
                message: "Unable to found user: " + user,
                token: null
            });

        // if the user is found but the password is wrong
        if (!bcrypt.compareSync(pass, result[0].password))
            return res.status(401).json({
                message: "Unable to provide a valid token",
                token: null
            });

        // if user is found and password is valid
        // create a token
        var token = jwt.sign(
            { id: result[0].id, username: result[0].username },
            auth.secret,
            { expiresIn: 60 * 60 * parseInt(auth.DEF_TOKEN_EXPIRE) }
        );

        // return the information including token as JSON
        res.status(200).json({
            message: "Authorized",
            token: token,
            user: result[0]
        });

        console.log(JSON.stringify({
            date: new Date().toISOString(),
            event: "token request", user
        }));
        
    } catch (err) {
        console.log(err)
        return res.status(500).json({
            message: "Unable to provide a valid token, internal error",
            token: null
        });
    }

});


//TODO CAMBIARE QUERY E UTILIZZARE SU FRONTEND
router.get('/me', verifyToken, function (req, res) {
    db.query(`SELECT * FROM Privileges WHERE id = ?`, [req.token.privilege], (err, result) => {
        var info = {
            id: req.token.id,
            username: req.token.username,
            privilege: result[0]
        };

        res.json(info)
    })
});

module.exports = router;