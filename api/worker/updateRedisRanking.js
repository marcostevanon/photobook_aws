const { Client } = require("pg");
const pg_options = require('../config/pg.config');

const redis = require('redis');
const redis_options = require('../config/redis.config');

module.exports = async function generateRatingList() {
    try {
        const pg_client = new Client(pg_options);
        await pg_client.connect();
        const query = `SELECT DISTINCT images.id, users.username as "user", images.raw_image_url as url, images.n_votes, images.avg_votes,
                            ($1 * images.avg_votes) + ($2 * images.n_votes) as score
                        FROM tsac18_stevanon.images
                        JOIN tsac18_stevanon.users ON images.id_user = users.id
                        LEFT JOIN tsac18_stevanon.votes ON images.id = votes.id_image
                        WHERE n_votes > 0
                        ORDER BY score DESC
                        LIMIT 5;`;

        const result = await pg_client.query(query, [1, 3]);
        // 3 = weigth for vote average for every image
        // 1 = weigth for the number of votes for every image

        await pg_client.end();

        // updating redis
        var redis_client = redis.createClient(redis_options);
        redis_client.on("error", err => console.log("Error " + err));
        redis_client.set("rating", JSON.stringify(result.rows), args => { redis_client.quit(); });

        return result.rows;
    } catch (err) {
        console.log(err);
        return null;
    }
}


//create pagination
// let rows = await client.query(`
//        SELECT images.id as id, username as user, images.raw_image_url as url, images.n_votes, images.avg_votes, votes.id as vote
//        FROM tsac18_stevanon.images
//            JOIN tsac18_stevanon.users ON tsac18_stevanon.images.id_user = tsac18_stevanon.users.id
//            LEFT JOIN tsac18_stevanon.votes ON images.id = votes.id_image AND votes.id_user = $1
//        ORDER BY images.id DESC;`, [req.token.id]);

// var array = rows.rows;
// if (array) {
//     var i, j, temparray, chunk = 10;
//     for (i = 0, j = array.length; i < j; i += chunk) {
//         temparray = array.slice(i, i + chunk);
//         // do whatever
//     }
//     console.log(temparray);
// }