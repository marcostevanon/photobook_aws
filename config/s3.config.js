const AWS = require('aws-sdk');

var bucket;
if (process.env.NODE_ENV == 'prod')
    bucket = process.env.BUCKET_PROD;
else
    bucket = process.env.BUCKET_STAGE

module.exports = {
    s3Client: new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.REGION
    }),
    uploadParams: {
        Bucket: bucket,
        Key: '', // will pass key
        Body: null, // will pass file body
    },
    cloudfrontURL: process.env.CLOUDFRONT
}