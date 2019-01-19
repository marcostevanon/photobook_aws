'use strict';
let router = require('express').Router();
const verifyToken = require('./auth');

const { Client } = require("pg");
const pg_options = require('../config/pg.config');

const redis = require('redis');
const redis_options = require('../config/redis.config');
const worker = require('../worker');

// /gallery
router.get('/', verifyToken, async (req, res) => {

    try {
        const pg_client = new Client(pg_options);
        await pg_client.connect();
        const query = `SELECT images.id as id, username as user, images.raw_image_url as url, images.n_votes, images.avg_votes, votes.id as vote, images.title as title, images.description as description
                        FROM tsac18_stevanon.images
                            JOIN tsac18_stevanon.users ON tsac18_stevanon.images.id_user = tsac18_stevanon.users.id
                            LEFT JOIN tsac18_stevanon.votes ON images.id = votes.id_image AND votes.id_user = $1
                        ORDER BY images.id DESC --LIMIT 40;`;
        let result = await pg_client.query(query, [req.token.id]);
        await pg_client.end();

        if (result) res.json(result.rows);
        else res.status(500).json({
            error: { status: 500, message: "Internal Error" }
        });
    } catch (err) {
        res.status(500).json({
            error: { status: 500, message: "Internal Error" }
        });
    }
});

// /gallery/rating
router.get('/rating', async (req, res) => {
    var redis_client = redis.createClient(redis_options);
    redis_client.on("error", err => {
        console.log("Redis error " + err);
        // return res.status(500).json({
        //     error: { status: 500, message: "Internal Error, Redis Error" }
        // });
    });

    redis_client.get("rating", async (err, reply) => {
        if (err)
            return res.status(500).json({
                error: { status: 500, message: "Internal Error, Redis Error" }
            });

        if (JSON.parse(reply)) {
            res.status(200).json(JSON.parse(reply));
            redis_client.quit();
        } else {
            var result = await worker.generateRatingList();
            res.status(200).json(result);
        }
    });
});

module.exports = router;