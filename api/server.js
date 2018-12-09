const express = require('express');
const app = express();
const cors = require('cors');

app.use(cors());
app.use('/gallery', require('./route/gallery.router'));
app.use('/upload', require('./route/upload.router'));

const server = app.listen(3000, () => {
    let host = server.address().address
    let port = server.address().port
    console.log("App listening at http://%s:%s", host, port);
})