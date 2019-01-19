'use strict';
let router = require('express').Router();
const verifyToken = require('./auth');

const { Client } = require("pg");
const pg_options = require('../config/pg.config');
const worker = require('../worker');

// /vote
router.post('/', verifyToken, async (req, res) => {
    var args = [req.body.image_id, req.body.user_id, req.body.vote_value];

    const pg_client = new Client(pg_options);
    pg_client.connect()
        .then(pg_client.query('BEGIN;'))
        .then(() => {
            const query = `INSERT INTO tsac18_stevanon.votes (id_image, id_user, value) VALUES ($1, $2, $3)`;
            return pg_client.query(query, args);
        })
        .then(db => console.log(`Write ${db.rowCount} row`))
        .then(() => { return worker.generateRatingList(); })
        .then(redis_res => res.status(200).json(redis_res))
        .then(() => {
            const query = `UPDATE tsac18_stevanon.images
                        SET avg_votes = (SELECT AVG(votes.value) FROM tsac18_stevanon.votes WHERE votes.id_image = $1),
                            n_votes   = (SELECT COUNT(votes.*)   FROM tsac18_stevanon.votes WHERE votes.id_image = $1)
                        WHERE id = $1`;
            return pg_client.query(query, [req.body.image_id]);
        })
        .then(db => console.log(`Update ${db.rowCount} row`))
        .then(pg_client.query('COMMIT;'))
        .catch(err => {
            console.log(err)
            res.sendStatus(500);
        });
});

module.exports = router;