/**
 *  /api/gallery
 */

'use strict';
let router = require('express').Router();
const verifyToken = require('./auth');

const { Client } = require("pg");
const pg_options = require('../config/pg.config');

const redis = require('redis');
const redis_options = require('../config/redis.config');

const worker = require('../worker');

// /api/gallery
router.get('/', verifyToken, async (req, res) => {
    console.time('/api/gallery');
    const pg_client = new Client(pg_options);
    const query = `SELECT images.id as id, username as user, images.resized_image_url as url, images.n_votes, 
                        images.avg_votes, votes.id as vote, images.title as title, images.description as description
                    FROM tsac18_stevanon.images
                        JOIN tsac18_stevanon.users ON tsac18_stevanon.images.id_user = tsac18_stevanon.users.id
                        LEFT JOIN tsac18_stevanon.votes ON images.id = votes.id_image AND votes.id_user = $1
                    ORDER BY images.id DESC`;

    pg_client.connect()
        .then(() => pg_client.query(query, [req.token.id]))
        .then(table => {
            pg_client.end();

            if (table) res.status(200).json(table.rows);
            else res.sendStatus(500);

            console.timeEnd('/api/gallery');
        }).catch(err => {
            res.sendStatus(500);
            console.log(err);
        });
});

// /api/gallery/rating
router.get('/rating', verifyToken, async (req, res) => {
    console.time('/api/gallery/rating');
    var redis_client = redis.createClient(redis_options);

    redis_client.on("error", err => console.log(err));
    redis_client.get("rating", (err, reply) => {
        if (err) return res.sendStatus(500)

        // check if redis cache is ready, otherwise create it
        if (reply) {
            res.status(200).json(JSON.parse(reply));
            console.timeEnd('/api/gallery/rating');
            redis_client.quit();
        } else {
            worker.generateRatingList()
                .then(result => {
                    res.status(200).json(result)
                    console.timeEnd('/api/gallery/rating');
                }).catch(err => {
                    res.sendStatus(500);
                    console.log(err);
                })
        }
    });
});

// /api/gallery/delete/:image_id
router.get('/delete/:image_id', verifyToken, async (req, res) => {
    console.time('/api/gallery/delete/');

    const pg_client = new Client(pg_options);
    const query = `DELETE FROM tsac18_stevanon.images
                    WHERE id = $2 AND id_user = $1;`;
    console.log(req.params.image_id);
    console.log(req.token.id);

    pg_client.connect()
        .then(() => pg_client.query(query, [req.token.id, req.params.image_id]))
        .then(response => {
            pg_client.end();
            console.log(response);

            if (response.rowCount) res.sendStatus(200);
            else res.sendStatus(400);

            console.timeEnd('/api/gallery/delete/');
        })
        .then(() => worker.generateRatingList())
        .catch(err => {
            res.sendStatus(400);
            console.log(err);
        });
});

module.exports = router;