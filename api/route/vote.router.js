let router = require('express').Router();
const verifyToken = require('./auth');
const { Client } = require("pg");

const redis = require('redis');
const redis_options = require('../config/redis.config')

router.post('/', verifyToken, async (req, res) => {
    console.log(req.body);
    var args = [req.body.image_id, req.body.user_id, req.body.vote_value];
    const client = new Client(require('../config/pg.config').pg);

    await client.connect();
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
    let rows_tocache = await require('../config/pg.config').query(`
            SELECT DISTINCT images.id as id, username as user, images.url, images.n_votes, images.avg_votes
            FROM tsac18_stevanon.images
                JOIN tsac18_stevanon.users ON tsac18_stevanon.images.id_user = tsac18_stevanon.users.id
                LEFT JOIN tsac18_stevanon.votes ON images.id = votes.id_image
            WHERE images.n_votes > 0
            ORDER BY images.avg_votes DESC, images.n_votes DESC
            LIMIT 3;`);
    rds_client.set("rating", JSON.stringify(rows_tocache.rows), args => {
        console.log(args);
        rds_client.quit();
    });

    await client.end();
    
    if (rows) res.json(rows.rows);
    else res.sendStatus(500);
});

module.exports = router;