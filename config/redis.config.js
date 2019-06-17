module.exports = process.env.NODE_ENV == 'prod'
    ? {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        password: process.env.REDIS_PASS
    }
    : {
        host: 'localhost',
        port: 6379,
        password: ''
    }