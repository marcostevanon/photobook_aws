module.exports = {
    host: process.env.NODE_ENV == 'prod-aws'
        ? process.env.ES_HOSTNAME_AWS
        : process.env.ES_HOSTNAME_VULTR
}