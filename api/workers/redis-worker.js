const { Client } = require("pg");
const pg_options = require('../../config/pg.config');

const redis = require('redis');
const redis_options = require('../../config/redis.config');

module.exports.generateRatingList = () => {
    console.time('Redis cache recreated');

    return new Promise(async (resolve, reject) => {
        const pg_client = new Client(pg_options);

        //Select first 10 photos with higer calculated score [score = (5 * image_average_value) + (3 * number_of_votes)]
        const query = `SELECT DISTINCT images.id,
                                users.id                    as author_id,
                                users.username              as author_username,
                                users.avatar                as author_avatar_url,
                                images.raw_image_url        as raw_image_url,
                                images.resized_image_url    as thumbnail_url,
                                images.title                as title,
                                images.description          as description,
                                images.tags::TEXT           as tags,
                                images.n_votes              as votes_n,
                                images.avg_votes            as votes_avg,
                                images.timestamp            as timestamp,
                                ($1 * images.avg_votes) + ($2 * images.n_votes) as score
                        FROM tsac18_stevanon.images
                            JOIN tsac18_stevanon.users ON tsac18_stevanon.images.id_user = tsac18_stevanon.users.id
                            LEFT JOIN tsac18_stevanon.votes ON tsac18_stevanon.images.id = tsac18_stevanon.votes.id_image
                        WHERE n_votes > 0
                        ORDER BY score DESC, images.timestamp DESC
                        LIMIT 10;`;

        pg_client.connect()
            .then(() => {
                return pg_client.query(query, [5, 3]);
                // 3 = weigth for the number of votes for every image
                // 5 = weigth for vote average for every image
            }).then(table => {
                pg_client.end();

                // updating redis
                var redis_client = redis.createClient(redis_options);
                redis_client.on("error", err => reject(err));
                redis_client.set("ranking", JSON.stringify(table.rows), args => {
                    redis_client.quit();
                    console.timeEnd('Redis cache recreated');

                    resolve(table.rows);
                });
            }).catch(err => reject(err));
    })
}

// module.exports.generatePaginator = () => { }


//create pagination
// let rows = await client.query(`
//        SELECT images.id as id, username as user, images.resized_image_url as url, images.n_votes, images.avg_votes, votes.id as vote
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