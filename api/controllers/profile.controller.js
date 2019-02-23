'use strict'

// import modules to query postgresql
const { Client: PgClient } = require("pg");
const pg_options = require('../../config/pg.config');

async function getProfileById(req, res) {

    var userId = req.params.userid;

    const pg_client = new PgClient(pg_options);
    const query = `SELECT id, username, firstname, lastname, avatar, email
                   FROM tsac18_stevanon.users
                   WHERE id = $1`;

    pg_client.connect()
        .then(() => pg_client.query(query, [userId]))
        .then(table => {
            pg_client.end();
            if (table.rows.length)
                res.json(table.rows);
            else
                res.sendStatus(404);
        })
        .catch(console.log);
}

async function getImageByProfileId(req, res) {

    var userId = req.params.userid;

    const pg_client = new PgClient(pg_options);
    const query = `SELECT
                        images.id                as post_id,
                        users.username           as author_username,
                        users.avatar             as author_avatar_url,
                        images.raw_image_url     as raw_image_url,
                        images.resized_image_url as thumbnail_url,
                        images.title             as title,
                        images.description       as description,
                        images.tags              as tags,
                        images.n_votes           as votes_n,
                        images.avg_votes         as votes_avg,
                        images.timestamp         as timestamp
                    FROM tsac18_stevanon.images
                        JOIN tsac18_stevanon.users ON tsac18_stevanon.images.id_user = tsac18_stevanon.users.id
                        LEFT JOIN tsac18_stevanon.votes ON images.id = votes.id_image AND votes.id_user = $1
                        WHERE users.id = $1
                        ORDER BY images.id DESC`;

    pg_client.connect()
        .then(() => pg_client.query(query, [userId]))
        .then(table => {
            pg_client.end();
            if (table.rows.length)
                res.json(table.rows);
            else
                res.sendStatus(404);
        })
        .catch(console.log);
}

module.exports = { getProfileById, getImageByProfileId }
