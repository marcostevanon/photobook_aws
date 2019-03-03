var host;
if (process.env.NODE_ENV == 'prod')
    host = process.env.RMQ_HOSTNAME_PROD;
else
    host = process.env.RMQ_HOSTNAME_STAGE;

module.exports = { rabbitMQconnectionstring: host }