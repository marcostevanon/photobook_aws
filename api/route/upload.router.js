let router = require('express').Router();
const verifyToken = require('./auth');
const uuid = require('uuid/v1');

const multer = require('multer');
var upload = multer({ storage: multer.memoryStorage() });
const s3 = require('../config/s3.config');

const { Client } = require("pg");
const pg_options = require('../config/pg.config');

const mq = require('amqplib/callback_api')
const mq_options = require('../config/mq.config.js');

// /upload
router.post('/', verifyToken, upload.single("image"), (req, res) => {

    if (req.file.mimetype.split('/')[0] != 'image')
        return res.status(400).json({ error: { status: 400, message: "Error -> File type not supported" } });

    const params = s3.uploadParams;
    params.Key = `images/raw/${uuid()}.${req.file.originalname}`;
    params.Body = req.file.buffer;

    s3.s3Client.upload(params, async (err, data) => {
        if (err)
            return res.status(500).json({ error: { status: 500, message: "Error -> " + err } });

        var imageUrl = createCloudfrontURL(data);

        var args = [req.token.id, imageUrl, req.file.originalname];
        args.push(req.body.title ? req.body.title : null);
        args.push(req.body.description ? req.body.description : null);
        
        console.log(args);

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