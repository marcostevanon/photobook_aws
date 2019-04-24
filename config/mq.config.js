module.exports = {
    rabbitMQconnectionstring: process.env.NODE_ENV == 'prod-aws'
        ? process.env.RMQ_HOSTNAME_AWS
        : process.env.RMQ_HOSTNAME_VULTR
}