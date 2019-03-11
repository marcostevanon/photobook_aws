const { Pool } = require('pg');

function initPgPool() {
	this.pool = new Pool({
		// pool use env for database host, user, psw etc
		idleTimeoutMillis: 10000,
		connectionTimeoutMillis: 3000,
		max: 50
	});
}

function getPool() { return this.pool; }

module.exports = { getPool, initPgPool }