'use strict';

// import modules to query postgresql
const { Client: PgClient } = require("pg");
const redis = require('redis');

const pg_options = require('../../config/pg.config');
const redis_options = require('../../config/redis.config');
const worker = require('../workers/redis-worker');

async function getGallery(req, res) {

    const pg_client = new PgClient(pg_options);
    const query = `SELECT 
                        images.id                as post_id,
                        users.id                 as author_id,
                        users.username           as author_username,
                        users.avatar             as author_avatar_url,
                        images.raw_image_url     as raw_image_url,
                        images.resized_image_url as thumbnail_url,
                        images.title             as title,
                        images.description       as description,
                        images.tags              as tags,
                        images.n_votes           as votes_n,
                        images.avg_votes         as votes_avg,
                        votes.id                 as vote,
                        images.timestamp         as timestamp
                    FROM tsac18_stevanon.images
                        JOIN tsac18_stevanon.users ON tsac18_stevanon.images.id_user = tsac18_stevanon.users.id
                        LEFT JOIN tsac18_stevanon.votes ON images.id = votes.id_image AND votes.id_user = $1
                    ORDER BY images.id DESC`;

    pg_client.connect()
        .then(() => pg_client.query(query, [req.token.id]))
        .then(table => {
            pg_client.end();

            if (table) res.status(200).json(table.rows);
            else res.sendStatus(400);
        }).catch(err => {
            res.sendStatus(500);
            console.log(err);
        });
}

async function getPost(req, res) {

    const pg_client = new PgClient(pg_options);
    const query = `SELECT 
                    images.id                as post_id,
                    users.id                 as author_id,
                    users.username           as author_username,
                    users.avatar             as author_avatar_url,
                    images.raw_image_url     as raw_image_url,
                    images.resized_image_url as thumbnail_url,
                    images.title             as title,
                    images.description       as description,
                    images.tags              as tags,
                    images.timestamp         as timestamp
                FROM tsac18_stevanon.images
                    JOIN tsac18_stevanon.users ON tsac18_stevanon.images.id_user = tsac18_stevanon.users.id
                WHERE images.id = $1 AND users.id = $2
                ORDER BY images.id DESC`;

    pg_client.connect()
        .then(() => pg_client.query(query, [req.params.image_id, req.token.id]))
        .then(table => {
            pg_client.end();

            if (table) res.status(200).json(table.rows[0]);
            else res.sendStatus(400);
        }).catch(err => {
            res.sendStatus(500);
            console.log(err);
        });
}

async function getRanking(req, res) {
    var redis_client = redis.createClient(redis_options);

    redis_client.on("error", err => console.log(err));
    redis_client.get("ranking", (err, reply) => {
        if (err) return res.sendStatus(500)

        // check if redis cache is ready, otherwise create it
        if (reply) {
            res.status(200).json(JSON.parse(reply));
            redis_client.quit();
        } else {
            worker.generateRatingList()
                .then(result => {
                    res.status(200).json(result)
                }).catch(err => {
                    res.sendStatus(500);
                    console.log(err);
                })
        }
    });
}

async function editImage(req, res) {

    var args = [
        req.body.title,
        req.body.description,
        req.body.tags.length ? JSON.stringify(req.body.tags) : null,
        req.params.image_id];

    const pg_client = new PgClient(pg_options);
    const query = `UPDATE tsac18_stevanon.images
                    SET title       = $1,
                        description = $2,
                        tags        = $3
                    WHERE id = $4;`;

    pg_client.connect()
        .then(() => pg_client.query(query, args))
        .then(response => {
            pg_client.end();
            if (response.rowCount) {
                res.sendStatus(201);
            } else {
                res.sendStatus(404);
            }
        })
        .then(() => { require('../workers/elastic-search.worker').updateImagesIndeces() })
        .catch(console.log)
}

async function deleteImage(req, res) {

    const pg_client = new PgClient(pg_options);
    const query = `DELETE FROM tsac18_stevanon.images
                    WHERE id = $2 AND id_user = $1;`;

    pg_client.connect()
        .then(() => pg_client.query(query, [req.token.id, req.params.image_id]))
        .then(response => {
            pg_client.end();

            if (response.rowCount)
                res.sendStatus(200);
            else
                res.sendStatus(400);
        })
        .then(() => { require('../workers/elastic-search.worker').updateImagesIndeces() })
        .then(() => worker.generateRatingList())
        .catch(err => {
            res.sendStatus(400);
            console.log(err);
        });
}

module.exports = { getGallery, getPost, getRanking, editImage, deleteImage }
