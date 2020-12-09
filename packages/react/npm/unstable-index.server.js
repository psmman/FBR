'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-unstable-index.production.min.server.js');
} else {
  module.exports = require('./cjs/react-unstable-index.development.server.js');
}
