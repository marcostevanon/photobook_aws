const app = require('express')();
const cors = require('cors');
const body_parser = require('body-parser');

console.log('Inizializing...');

app.use(cors());
app.use(body_parser.json());
app.use('/auth', require('./route/auth.router'))
app.use('/gallery', require('./route/gallery.router'));
app.use('/upload', require('./route/upload.router'));
app.use('/vote', require('./route/vote.router'))

setTimeout(() => {
    require('./worker').generateRatingList()
        .then(() => {
            const server = app.listen(5671, () => {
                console.log(`\nApp listening at http://${server.address().address}:${server.address().port}`);
            });
        }).catch(err => console.log(err));
}, 1/*1000*/);