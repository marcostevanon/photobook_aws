require('dotenv').config();

const app = require('express')();
const cors = require('cors');
const morgan = require('morgan');
const body_parser = require('body-parser');
const cron = require('node-cron');

console.log('Inizializing...');
console.log(new Date().toUTCString())

require('./config/pg.config').initPgPool();

app.use(cors());
app.use(morgan(':date[iso] [:response-time[digits]ms] :remote-addr :method :url :status \t :referrer'));
app.use(body_parser.json());

app.use('/api/auth', require('./route/auth.router'))
app.use('/api/gallery', require('./route/gallery.router'));
app.use('/api/upload', require('./route/upload.router'));
app.use('/api/vote', require('./route/vote.router'));
app.use('/api/profile', require('./route/profile.router'));
app.use('/api/search', require('./route/search.router'));
app.get('/', (req, res) => res.send('<h1>It works!</h1>'));
app.all('*', (req, res) => res.sendStatus(404));

function regenerateCache() {
	require('./workers/redis-worker').generateRatingList()
		.then(() => require('./workers/elastic-search.worker').updateImagesIndeces())
		.then(() => require('./workers/elastic-search.worker').updateUsersIndeces())
		.then(() => require('./workers/rabbit-mq.worker').startListening())
		.catch(err => console.warn(err));
}

console.log('Waiting for services start...');
setTimeout(() => {

	const server = app.listen(process.env.PORT, () => {
		console.log(`\nApp listening at http://${server.address().address}:${server.address().port}`);
	});

	// require('./workers/redis-worker2').generateGallery();

	// Schedule cache regeneration every day at 00:00
	cron.schedule('0 0 * * *', regenerateCache);
	regenerateCache();

}, 45000);


