const app = require('express')();
const cors = require('cors');
const body_parser = require('body-parser');
const morgan = require('morgan');

console.log('Inizializing...');

app.use(cors());
app.use(body_parser.json());
app.use(morgan(':date[iso] [:response-time[digits]ms] :remote-addr :method :url :status \t :referrer'));

app.use('/api/auth', require('./route/auth.router'))
app.use('/api/gallery', require('./route/gallery.router'));
app.use('/api/upload', require('./route/upload.router'));
app.use('/api/vote', require('./route/vote.router'));
app.use('/api/profile', require('./route/profile.router'));
app.use('/api/search', require('./route/search.router'));

setTimeout(() => {
	require('./workers/redis-worker').generateRatingList()
		.then(() => { require('./workers/elastic-search.worker').updateImagesIndeces() })
		.then(() => { require('./workers/elastic-search.worker').updateUsersIndeces() })
		.then(() => {
			const server = app.listen(5671, () => {
				console.log(`\nApp listening at http://${server.address().address}:${server.address().port}`);
			});
		})
		.catch(err => console.warn(err));
}, 1/*10000*/);