/**
 *  /api/upload
 */

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
const mq = require('amqplib');
const mq_options = require('../config/mq.config.js');

// /api/upload
router.post('/', verifyToken, upload.single("image"), (req, res) => {

    console.time('/api/upload');

    // verifies the tipe of file to upload
    if (req.file.mimetype.split('/')[0] != 'image')
        // if file is not an image, return 400
        return res.status(400).send("Upload -> File type not supported");

    //prepare file for upload
    const uuid1 = uuid();
    const params = s3.uploadParams;
    params.Key = `images/raw/${uuid1}.${req.file.originalname}`;   //file key will be --> image/raw/{unique_identifier}.{originalfilename}.{originalextention}
    params.Body = req.file.buffer;

    s3.s3Client.upload(params, (err, data) => {
        if (err)
            return res.status(500).send("Upload -> " + err);

        //transform url to make file accessible from cloudfront CDN
        var imageUrl = createCloudfrontURL(data);

        //prepare file metadata for push into DB
        var args = [req.token.id, imageUrl, req.file.originalname];
        args.push(req.body.title ? req.body.title : '');
        args.push(req.body.description ? req.body.description : '');

        const pg_client = new Client(pg_options);
        const query = `INSERT INTO "tsac18_stevanon".images (id_user, raw_image_url, status, original_name, title, description) 
                        VALUES ($1, $2, 'pending', $3, $4, $5)
                        RETURNING *`;

        pg_client.connect()
            .then(() => pg_client.query(query, args))
            .then(response => {
                pg_client.end();

                var msg = { image_id: response.rows[0].id, url: imageUrl, /*author_id: req.token.id,*/ filename: req.file.originalname, uuid: uuid1 }
                res.json(msg);

                var queue = 'photo_processing';
                mq.connect(mq_options)
                    .then(conn => conn.createChannel())
                    .then(ch => ch.assertQueue(queue)
                        .then(ok => ch.sendToQueue(queue, Buffer.from(JSON.stringify(msg)))))
                    .then(console.timeEnd('/api/upload'))
                    .catch(console.warn);
            }).catch(console.log);
    });
});

function createCloudfrontURL(data) {
    var url = data.Location.split('/');
    url[2] = s3.cloudfrontURL;
    return url.join('/');
}

module.exports = router;