const mq = require('amqplib');
const mq_options = require('../config/mq.config.js');

var request = require('request');
var sharp = require('sharp');

const s3 = require('../config/s3.config');

const pg = require('../config/pg.config').getPool();

var queue = 'photo_processing';
setTimeout(() => startListening(), 1);

function startListening() {
    mq.connect(mq_options)
        .then(conn => conn.createChannel())
        .then(ch => ch.assertQueue(queue)
            .then(ok => {
                console.log(ok);
                return ch.consume(queue, msg =>
                    createThumbnail(JSON.parse(msg.content.toString()))
                        .then(() => ch.ack(msg))
                );
            }))
        .catch(console.warn);
}

function createThumbnail(msg) {
    console.time('thumb');
    console.log(msg);

    return new Promise((resolve, reject) => {
        request({ url: msg.url, encoding: null }, (err, res, body) => {
            sharp(body)
                .resize({
                    width: 500,
                    height: 500,
                    fit: 'contain',
                    background: { r: 255, g: 255, b: 255, alpha: 0.88 }
                })
                // .toFile('output.jpg')
                .toBuffer()
                .then(buffer => {
                    return new Promise((resolve, reject) => {

                        //prepare file for upload
                        const params = s3.uploadParams;
                        params.Body = buffer;
                        params.Key = `images/thumbnail/${msg.uuid}.thumb.${msg.filename}`;
                        //file key will be --> images/thumbnail/{unique_identifier}.thumb.{originalfilename}.{originalextention}

                        s3.s3Client.upload(params, (err, data) => {
                            if (err) reject(err)
                            else resolve(data)
                        })
                    })
                })
                .then(data => {
                    //transform url to make file accessible from cloudfront CDN
                    var imageUrl = createCloudfrontURL(data);

                    //prepare file metadata for push into DB
                    const query = `UPDATE tsac18_stevanon.images
                                    SET resized_image_url = $1, status = $2
                                    WHERE id = $3`;
                    var args = [imageUrl, 'uploaded', msg.image_id];

                    return pg.query(query, args)
                })
                .then(() => {
                    console.timeEnd('thumb');
                    resolve(res)
                })
                .catch(err => {
                    reject(err);
                    console.log(err);
                });
        });
    })
}

function createCloudfrontURL(data) {
    var url = data.Location.split('/');
    url[2] = s3.cloudfrontURL;
    return url.join('/');
}