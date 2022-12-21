
window.isNode = false;

if (typeof window === 'undefined')
	module.exports = require('./backend');
else
	module.exports = require('./frontend');
	