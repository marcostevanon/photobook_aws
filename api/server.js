const app = require('express')();
const cors = require('cors');
const body_parser = require('body-parser');

console.log('Inizializing...');

app.use(cors());
app.use(body_parser.json());

app.use('/api/auth', require('./route/auth.router'))
app.use('/api/gallery', require('./route/gallery.router'));
app.use('/api/upload', require('./route/upload.router'));
app.use('/api/vote', require('./route/vote.router'))
app.use('/api/profile', require('./route/profile.router'))

setTimeout(() => {
	require('./worker').generateRatingList()
		.then(() => {
			const server = app.listen(5671, () => {
				console.log(`\nApp listening at http://${server.address().address}:${server.address().port}`);
			});
		}).catch(err => console.log(err));
}, 1/*10000*/);