let express = require('express');
let router = express.Router();

const multer = require('multer');
var upload = multer({ storage: multer.memoryStorage() });

const s3 = require('../config/s3.config');

router.post('/', upload.single("image"), (req, res) => {
    const s3Client = s3.s3Client;
    const params = s3.uploadParams;

    params.Key = req.file.originalname;
    params.Body = req.file.buffer;

    if (req.file.mimetype.split('/')[0] != 'image')
        return res.status(400).json({ error: "Error -> File type not supported" });

    s3Client.upload(params, (err, data) => {
        if (err) return res.status(500).json({ error: "Error -> " + err });
        res.json({ message: 'File uploaded successfully! -> keyname = ' + req.file.originalname });
    });
});

module.exports = router;