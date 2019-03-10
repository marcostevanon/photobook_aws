module.exports = {
    host: process.env.NODE_ENV == 'prod'
        ? process.env.ES_HOSTNAME_PROD
        : process.env.ES_HOSTNAME_STAGE
}