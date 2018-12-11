let router = require('express').Router();
const verifyToken = require('./auth');
const { Client } = require("pg");

router.post('/', verifyToken, async (req, res) => {
    console.log(req.body);
    var args = [req.body.image_id, req.body.user_id, req.body.vote_value];
    const client = new Client(require('../config/pg.config'));

    await client.connect();
    let rows = await client.query(`INSERT INTO tsac18_stevanon.votes (id_image, id_user, value) 
                                    VALUES ($1, $2, $3)`, args);

    let x = await client.query(`UPDATE tsac18_stevanon.images
                        SET avg_votes = (SELECT AVG(votes.value)
                                        FROM tsac18_stevanon.votes
                                        WHERE votes.id_image = $1),
                            n_votes = (SELECT COUNT(votes.*)
                                        FROM tsac18_stevanon.votes
                                        WHERE votes.id_image = $1)
                        WHERE id = $1`, [req.body.image_id]);
    console.log(args);
    await client.end();
    if (rows) res.json(rows.rows);
    else res.sendStatus(500);
});

module.exports = router;