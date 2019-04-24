module.exports = process.env.NODE_ENV == 'prod-aws'
    ? {
        host: process.env.REDIS_HOSTNAME_AWS,
        port: process.env.REDIS_PORT_AWS,
        password: process.env.REDIS_PASS_AWS
    }
    : {
        host: process.env.REDIS_HOST_VULTR,
        port: process.env.REDIS_PORT_VULTR,
        password: process.env.REDIS_PASS_VULTR
    }