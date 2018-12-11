let router = require('express').Router();
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

    s3Client.upload(params, (err, data) => {
        if (err) return res.status(500).json({ error: "Error -> " + err });
        var msg = { message: 'File uploaded successfully! -> keyname = ' + req.file.originalname };
        console.log(msg.message);
        res.json(msg);
    });
});

module.exports = router;