let router = require('express').Router();
const pg = require('../config/pg.config');
const verifyToken = require('./auth');
const redis = require('redis');
const redis_options = require('../config/redis.config');

router.get('/', verifyToken, async (req, res) => {
    let rows = await pg.query(`
                SELECT images.id as id, username as user, images.url, images.n_votes, images.avg_votes, votes.id as vote
               FROM tsac18_stevanon.images
                   JOIN tsac18_stevanon.users ON tsac18_stevanon.images.id_user = tsac18_stevanon.users.id
                   LEFT JOIN tsac18_stevanon.votes ON images.id = votes.id_image AND votes.id_user = $1
               ORDER BY images.id DESC --LIMIT 40;`, [req.token.id]);
    if (rows) res.json(rows.rows);
    else res.sendStatus(500);
});

router.get('/rating', async (req, res) => {
    var rds_client = redis.createClient(redis_options);
    rds_client.on("error", err => console.log("Error " + err));
    rds_client.get("rating", async (err, reply) => {
        console.log('cache: ');
        console.log(JSON.parse(reply));

        if (JSON.parse(reply)) res.json(JSON.parse(reply));
        else {
            try {
                let rows = await pg.query(`
                SELECT DISTINCT images.id, users.username as "user", images.url, images.n_votes, images.avg_votes,
                                ($1 * images.avg_votes) + ($2 * images.n_votes) as score
                FROM tsac18_stevanon.images
                    JOIN tsac18_stevanon.users ON images.id_user = users.id
                    LEFT JOIN tsac18_stevanon.votes ON images.id = votes.id_image
                WHERE n_votes > 0
                ORDER BY score DESC
                LIMIT 3;`, [3, 1]); //3 = weigth for vote average for every image
                                    //1 = weigth for the number of votes for every image
                res.json(rows.rows);
            } catch (e) {
                res.sendStatus(500);
            }
        }

        rds_client.quit();
    });
});


module.exports = router;
