'use strict';

const elsClient = require('../workers/elastic-search.worker').client;

async function search(req, res) {
    const query = req.params.keyword;

    var searchByImageMeta = elsClient.search({
        body: {
            from: 0, size: 30,
            query: {
                multi_match: {
                    query: query,
                    fields: ['title', 'description'],
                    fuzziness: 1
                }
            }
        }
    })

    var searchByImageTags = elsClient.search({
        body: {
            from: 0, size: 30,
            query: {
                match:
                    { tags: query }
            }
        }
    })

    var searchByUser = elsClient.search({
        body: {
            from: 0, size: 30,
            query: {
                multi_match: {
                    query: query,
                    fields: ['username', 'firstname', 'lastname'],
                    fuzziness: 1
                }
            }
        }
    })

    Promise.all([searchByImageMeta, searchByImageTags, searchByUser])
        .then(response => {
            res.status(200).json({
                byTitleDesc: {
                    count: response[0].hits.total,
                    data: response[0].hits.hits.map(item => item._source)
                },
                byTags: {
                    count: response[1].hits.total,
                    data: response[1].hits.hits.map(item => item._source)
                },
                byUser: {
                    count: response[2].hits.total,
                    data: response[2].hits.hits.map(item => item._source)
                }
            });
        })
}

module.exports = { search };
