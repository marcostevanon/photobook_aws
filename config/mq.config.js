module.exports = {
    rabbitMQconnectionstring:
        process.env.NODE_ENV == 'prod'
            ? process.env.RMQ_HOSTNAME_PROD
            : process.env.RMQ_HOSTNAME_STAGE
}