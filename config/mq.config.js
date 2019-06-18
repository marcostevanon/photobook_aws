module.exports = {
    rabbitMQconnectionstring: process.env.NODE_ENV == 'prod'
        ? process.env.RMQ_HOSTNAME
        : 'localhost'
}