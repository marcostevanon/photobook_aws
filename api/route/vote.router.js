let router = require('express').Router();
const verifyToken = require('./auth');
const { Client } = require("pg");
const pg = require('../config/pg.config')

const redis = require('redis');
const redis_options = require('../config/redis.config')

router.post('/', verifyToken, async (req, res) => {
    console.log(req.body);
    var args = [req.body.image_id, req.body.user_id, req.body.vote_value];
    const client = new Client(pg.pg);

    await client.connect();
    await client.query('BEGIN;');
    let rows = await client.query(`INSERT INTO tsac18_stevanon.votes (id_image, id_user, value) 
                                    VALUES ($1, $2, $3)`, args);

    await client.query(`UPDATE tsac18_stevanon.images
                        SET avg_votes = (SELECT AVG(votes.value)
                                        FROM tsac18_stevanon.votes
                                        WHERE votes.id_image = $1),
                            n_votes = (SELECT COUNT(votes.*)
                                        FROM tsac18_stevanon.votes
                                        WHERE votes.id_image = $1)
                        WHERE id = $1`, [req.body.image_id]);

    var rds_client = redis.createClient(redis_options);
    rds_client.on("error", (err) => console.log("Error " + err));
    let rows_tocache = await client.query(`
                    SELECT DISTINCT images.id, users.username as "user", images.url, images.n_votes, images.avg_votes,
                                    ($1 * images.avg_votes) + ($2 * images.n_votes) as score
                    FROM tsac18_stevanon.images
                        JOIN tsac18_stevanon.users ON images.id_user = users.id
                        LEFT JOIN tsac18_stevanon.votes ON images.id = votes.id_image
                    WHERE n_votes > 0
                    ORDER BY score DESC
                    LIMIT 3;`, [3, 1]);

    rds_client.set("rating", JSON.stringify(rows_tocache.rows), args => {
        console.log(args);
        rds_client.quit();
    });

    await client.query('COMMIT;');
    await client.end();

    if (rows) res.json(rows.rows);
    else res.sendStatus(500);
});

module.exports = router;