'use strict';
let router = require('express').Router();
const verifyToken = require('./auth');

const { Client } = require("pg");
const pg_options = require('../../config/pg.config');

const worker = require('../worker');

// /api/vote
router.post('/', verifyToken, async (req, res) => {

    const pg_client = new Client(pg_options);
    pg_client.connect()
        .then(() => pg_client.query('BEGIN;'))

        // insert new vote in vote table
        .then(() => {
            const query = `INSERT INTO tsac18_stevanon.votes (id_image, id_user, value) VALUES ($1, $2, $3) RETURNING *`;
            return pg_client.query(query, [req.body.image_id, req.body.user_id, req.body.value])
        })
        // .then((db) => console.log(`Write ${db.rowCount} row`))

        // update vote number and vote average on image table
        .then((db) => {
            const query = `UPDATE tsac18_stevanon.images
                        SET avg_votes = (SELECT AVG(votes.value) FROM tsac18_stevanon.votes WHERE votes.id_image = $1),
                            n_votes   = (SELECT COUNT(votes.*)   FROM tsac18_stevanon.votes WHERE votes.id_image = $1)
                        WHERE id = $1`;
            return pg_client.query(query, [req.body.image_id])
        })
        // .then((db) => console.log(`Update ${db.rowCount} row`))
        .then(() => pg_client.query('COMMIT;'))

        // select new vote values
        .then(() => {
            const query = `SELECT n_votes as votes_n, avg_votes as votes_avg
                            FROM tsac18_stevanon.images
                            WHERE id = $1`;
            return pg_client.query(query, [req.body.image_id])
        })
        .then(response => res.status(201).json(response.rows[0]))

        // regenerate redis cache
        .then(() => worker.generateRatingList())
        .catch((err) => {
            console.log(err)
            res.sendStatus(500);
        });
});

module.exports = router;