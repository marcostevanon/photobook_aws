/**
 *  /api/profile
 */

'use strict';
let router = require('express').Router();

//import middleware to authenticate apis
const verifyToken = require('./auth');

// import modules to query postgresql
const { Client } = require("pg");
const pg_options = require('../../config/pg.config');

// /api/profile/me
router.get('/me', verifyToken, (req, res) => {

    const pg_client = new Client(pg_options);
    const query = `SELECT id, original_name, title, description, tags,
                        resized_image_url, resized_image_url, n_votes, avg_votes, timestamp
                    FROM tsac18_stevanon.images
                    WHERE id_user = $1`;

    pg_client.connect()
        .then(() => pg_client.query(query, [req.token.id]))
        .then(table => {
            res.json(table.rows);
            pg_client.end();
        }).catch(console.log);
})

// /api/profile/:id
router.get('/:id', verifyToken, (req, res) => {

    const pg_client = new Client(pg_options);
    const query = `SELECT images.id, users.username, resized_image_url, n_votes, avg_votes, timestamp,
                        resized_image_url, original_name, title, description, tags
                    FROM tsac18_stevanon.images
                        JOIN tsac18_stevanon.users ON images.id_user = users.id
                    WHERE id_user = $1`;

    pg_client.connect()
        .then(() => pg_client.query(query, [req.params.id]))
        .then(table => {
            res.json(table.rows);
            pg_client.end()
        }).catch(err => {
            console.log(err);
            res.sendStatus(400)
        });
})


module.exports = router;