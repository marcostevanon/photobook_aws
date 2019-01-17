let router = require('express').Router();
const verifyToken = require('./auth');

const { Client } = require("pg");
const pg_options = require('../config/pg.config');
const updateRedisRanking = require('../worker/updateRedisRanking');

// /vote
router.post('/', verifyToken, async (req, res) => {
    var args = [req.body.image_id, req.body.user_id, req.body.vote_value];

    const pg_client = new Client(pg_options);
    await pg_client.connect();
    await pg_client.query('BEGIN;');

    var query = `INSERT INTO tsac18_stevanon.votes (id_image, id_user, value) VALUES ($1, $2, $3)`;
    await pg_client.query(query, args);

    var update_result = await updateRedisRanking();
    if (update_result) res.status(200).json(update_result);
    else res.sendStatus(500);
    console.log(update_result);

    query = `UPDATE tsac18_stevanon.images
                    SET avg_votes = (SELECT AVG(votes.value)
                                    FROM tsac18_stevanon.votes
                                    WHERE votes.id_image = $1),
                        n_votes = (SELECT COUNT(votes.*)
                                    FROM tsac18_stevanon.votes
                                    WHERE votes.id_image = $1)
                    WHERE id = $1`;
    await pg_client.query(query, [req.body.image_id]);
    await pg_client.query('COMMIT;');
    await pg_client.end();
});

module.exports = router;