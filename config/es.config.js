module.exports = {
    host: process.env.NODE_ENV == 'prod'
        ? process.env.ES_HOSTNAME
        : 'localhost'
}