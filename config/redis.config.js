var host, port;
if (process.env.NODE_ENV == 'prod') {
    host = process.env.REDIS_HOSTNAME_PROD;
    port = process.env.REDIS_PORT_PROD;
} else {
    host = process.env.REDIS_HOSTNAME_STAGE;
    port = process.env.REDIS_PORT_STAGE;
}

module.exports = { host, port }