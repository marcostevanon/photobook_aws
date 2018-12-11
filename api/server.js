const app = require('express')();
const cors = require('cors');
const body_parser = require('body-parser');

app.use(cors());
app.use(body_parser.json());
app.use('/auth', require('./route/auth.router'))
app.use('/gallery', require('./route/gallery.router'));
app.use('/upload', require('./route/upload.router'));
app.use('/vote', require('./route/vote.router'))

const server = app.listen(3000, () => {
    let host = server.address().address
    let port = server.address().port
    console.log("App listening at http://%s:%s", host, port);
})