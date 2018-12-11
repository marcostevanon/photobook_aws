let router = require('express').Router();
const { Client } = require("pg");
const verifyToken = require('./auth');

router.get('/', verifyToken, async (req, res) => {
    const client = new Client(require('../config/pg.config'));
    await client.connect();
    let rows = await client.query(`
            SELECT images.id as id, username as user, images.url, images.n_votes, images.avg_votes, votes.id as vote
            FROM tsac18_stevanon.images
                JOIN tsac18_stevanon.users ON tsac18_stevanon.images.id_user = tsac18_stevanon.users.id
                LEFT JOIN tsac18_stevanon.votes ON images.id = votes.id_image AND tsac18_stevanon.users.id = $1
            ORDER BY images.id DESC;;`, [req.query.user_id]);
    await client.end();
    if (rows) res.json(rows.rows);
    else res.sendStatus(500);
});

module.exports = router;