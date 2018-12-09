let express = require('express');
let router = express.Router();
const { Client } = require("pg");

router.get('/', async (req, res) => {
    const client = new Client(require('../config/pg.config'));
    await client.connect();
    let rows = await client.query(`SELECT images.id, username as user, images.url
                                    FROM tsac18_stevanon.images
                                        JOIN tsac18_stevanon.users 
                                            ON tsac18_stevanon.images.id_user 
                                                = tsac18_stevanon.users.id;`);
    await client.end();
    if (rows) res.json(rows.rows);
    else res.sendStatus(500);
});

module.exports = router;