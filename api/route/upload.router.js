'use strict';
let router = require('express').Router();

const verifyToken = require('./auth');  //import middleware to authenticate apis
const uuid = require('uuid/v1');

// import modules to upload files on AWS S3
const multer = require('multer');
var upload = multer({ storage: multer.memoryStorage() });
const s3 = require('../config/s3.config');

// import modules to query postgresql
const { Client } = require("pg");
const pg_options = require('../config/pg.config');

// import modules to call rabbitmq
const mq = require('amqplib/callback_api');
const mq_options = require('../config/mq.config.js');

// /upload
router.post('/', verifyToken, upload.single("image"), (req, res) => {

    // verifies the tipe of file to upload
    if (req.file.mimetype.split('/')[0] != 'image')
        // if file is not an image, return 400
        return res.status(400).json({ error: { status: 400, message: "Error -> File type not supported" } });

    //prepare file for upload
    const params = s3.uploadParams;
    params.Key = `images/raw/${uuid()}.${req.file.originalname}`;   //file key will be --> image/raw/{unique_identifier}.{originalfilename}.{originalextention}
    params.Body = req.file.buffer;

    s3.s3Client.upload(params, async (err, data) => {
        if (err)
            return res.status(500).json({ error: { status: 500, message: "Error -> " + err } });

        //transform url to make file accessible from cloudfront CDN
        var imageUrl = createCloudfrontURL(data);

        //prepare file metadata for push into DB
        var args = [req.token.id, imageUrl, req.file.originalname];
        args.push(req.body.title ? req.body.title : '');
        args.push(req.body.description ? req.body.description : '');

        const pg_client = new Client(pg_options);
        await pg_client.connect();
        const query = `INSERT INTO "tsac18_stevanon".images (id_user, raw_image_url, original_name, title, description) VALUES ($1, $2, $3, $4, $5)`;
        await pg_client.query(query, args);
        await pg_client.end();

        var msg = { url: imageUrl, author_id: req.token.id }
        res.json(msg);

        mq.connect(mq_options, (err, conn) => {
            if (err) console.log(err);

            conn.createChannel((err, ch) => {
                var queue = 'photo_processing';

                ch.assertQueue(queue, { durable: true });
                ch.sendToQueue(queue, new Buffer.from(JSON.stringify(msg)));
                setTimeout(() => conn.close(), 100);
            });
        });
    });
});

function createCloudfrontURL(data) {
    var url = data.Location.split('/');
    url[2] = s3.cloudfrontURL;
    return url.join('/');
}

module.exports = router;