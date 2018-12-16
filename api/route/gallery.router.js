let router = require('express').Router();
const pg = require('../config/pg.config')
const verifyToken = require('./auth');
const redis = require('redis');
const redis_options = require('../config/redis.config')

router.get('/', verifyToken, async (req, res) => {
    let rows = await pg.query(`
                SELECT images.id as id, username as user, images.url, images.n_votes, images.avg_votes, votes.id as vote
               FROM tsac18_stevanon.images
                   JOIN tsac18_stevanon.users ON tsac18_stevanon.images.id_user = tsac18_stevanon.users.id
                   LEFT JOIN tsac18_stevanon.votes ON images.id = votes.id_image AND votes.id_user = $1
               ORDER BY images.id DESC;`, [req.token.id]);
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
                        SELECT DISTINCT images.id as id, username as user, images.url, images.n_votes, images.avg_votes
                        FROM tsac18_stevanon.images
                            JOIN tsac18_stevanon.users ON tsac18_stevanon.images.id_user = tsac18_stevanon.users.id
                            LEFT JOIN tsac18_stevanon.votes ON images.id = votes.id_image
                        WHERE images.n_votes > 0
                        ORDER BY images.avg_votes DESC, images.n_votes DESC
                        LIMIT 3;`);
                res.json(rows.rows);
            } catch (e) {
                res.sendStatus(500);
            }
        }

        rds_client.quit();
    });
});


module.exports = router;
