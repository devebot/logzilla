'use strict';

var Service = require('./lib/logfactory');

Service.defaultLogger = (new Service()).getLogger();

Service.prototype.defaultLogger = Service.defaultLogger;

module.exports = Service;
