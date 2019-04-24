const elasticsearch = require('elasticsearch');
const es_config = require('../config/es.config');

var client = new elasticsearch.Client(es_config);

const pg = require('../config/pg.config').getPool();

function updateImagesIndeces() {
    return new Promise((resolve, reject) => {
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
        // client.indices.exists({ index: "images" })
        // client.indices.create({ index: "images"})
        //     .then(() =>
        pg.query(query)
            // )
            .then(db => {
                db.rows.forEach(item => {
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
        const query = `SELECT DISTINCT id, username, firstname, lastname, avatar
                    FROM tsac18_stevanon.users`;

        var newUsersArray_bulk = [];

        // client.indices.create({ index: "users" })
        //     .then(() =>
        pg.query(query)
            // )
            .then(db => {
                db.rows.forEach(item => {
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
                resolve(resp.items)
            })
            .catch(err => reject(err))
    })
}

module.exports = { client, updateImagesIndeces, updateUsersIndeces }