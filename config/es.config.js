var host;
if (process.env.NODE_ENV == 'prod')
    host = process.env.ES_HOSTNAME_PROD;
else
    host = process.env.ES_HOSTNAME_STAGE;

module.exports = { host }