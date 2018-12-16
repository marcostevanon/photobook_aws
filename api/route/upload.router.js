let router = require('express').Router();
const { Client } = require("pg");
const verifyToken = require('./auth');

const multer = require('multer');
var upload = multer({ storage: multer.memoryStorage() });

const s3 = require('../config/s3.config');

router.post('/', verifyToken, upload.single("image"), (req, res) => {

    const s3Client = s3.s3Client;
    const params = s3.uploadParams;

    params.Key = 'images/' + req.file.originalname;
    params.Body = req.file.buffer;

    if (req.file.mimetype.split('/')[0] != 'image')
        return res.status(400).json({ error: "Error -> File type not supported" });

    s3Client.upload(params, async (err, data) => {
        if (err) return res.status(500).json({ error: "Error -> " + err });
        var msg = { message: 'File uploaded successfully! -> keyname = ' + req.file.originalname };
        console.log(msg.message);

        var data = data.Location.split('/');
        data[2] = 'd3v4yqdep5qmmr.cloudfront.net';
        var imageUrl = data.join('/');
        msg.url = imageUrl;
        console.log(imageUrl);

        const client = new Client(require('../config/pg.config').pg);
        await client.connect();
        await client.query(`INSERT INTO "tsac18_stevanon".images (id_user, url) VALUES ($1, $2)`, [req.token.id, imageUrl]);
        await client.end();

        res.json(msg);
    });
});

module.exports = router;