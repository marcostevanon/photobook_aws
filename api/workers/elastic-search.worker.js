var elasticsearch = require('elasticsearch');

var client = new elasticsearch.Client({
    // host: 'http://[username]:[password]@[server]:[port]/',
    host: 'http://ec2-63-33-232-170.eu-west-1.compute.amazonaws.com:9200/',
    // host: 'http://localhost:9200/',
    // host: 'http://debian:9200/',
    // log:  'trace'
});


const { Client } = require("pg");
const pg_options = require('../../config/pg.config');

function updateImagesIndeces() {
    return new Promise((resolve, reject) => {
        const pg_client = new Client(pg_options);
        const query = `SELECT DISTINCT
                            images.id                as post_id,
                            users.username           as author_username,
                            users.avatar             as author_avatar_url,
                            images.raw_image_url     as raw_image_url,
                            images.resized_image_url as thumbnail_url,
                            images.title             as title,
                            images.description       as description,
                            images.tags::TEXT        as tags,
                            images.n_votes           as votes_n,
                            images.avg_votes         as votes_avg,
                            images.timestamp         as timestamp
                        FROM tsac18_stevanon.images
                            JOIN tsac18_stevanon.users ON tsac18_stevanon.images.id_user = tsac18_stevanon.users.id
                            LEFT JOIN tsac18_stevanon.votes ON images.id = votes.id_image`;

        var newImagesArray_bulk = [];

        pg_client.connect()
            .then(() => pg_client.query(query))
            .then(table => {
                pg_client.end()

                table.rows.forEach(item => {
                    newImagesArray_bulk.push({
                        index: {
                            _index: "images", _type: "image",
                            _id: item.post_id
                        }
                    }, item)
                })

                return client.bulk({
                    index: 'images', type: 'image',
                    body: newImagesArray_bulk
                })
            })
            .then(resp => {
                console.log("ES - Images OK \t-> count:", resp.items.length);
                resolve(resp.items.length)
            })
            .catch(err => reject(err))
    })
}

function updateUsersIndeces() {
    return new Promise((resolve, reject) => {
        const pg_client = new Client(pg_options);
        const query = `SELECT DISTINCT id, username, firstname, lastname, avatar
                    FROM tsac18_stevanon.users`;

        var newUsersArray_bulk = [];

        pg_client.connect()
            .then(() => pg_client.query(query))
            .then(table => {
                pg_client.end()

                table.rows.forEach(item => {
                    newUsersArray_bulk.push({
                        index: {
                            _index: "users", _type: "user",
                            _id: item.id
                        }
                    }, item)
                })

                return client.bulk({
                    index: 'users', type: 'user',
                    body: newUsersArray_bulk
                })
            })
            .then(resp => {
                console.log("ES - Users OK \t-> count:", resp.items.length);
                resolve(resp.items.length)
            })
            .catch(err => reject(err))
    })
}

module.exports = { client, updateImagesIndeces, updateUsersIndeces }