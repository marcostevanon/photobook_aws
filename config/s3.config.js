const AWS = require('aws-sdk');

module.exports = {
    s3Client: new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.REGION
    }),
    uploadParams: {
        Bucket: process.env.BUCKET,
        Key: '', // will pass key
        Body: null, // will pass file body
    },
    cloudfrontURL: process.env.CLOUDFRONT
}