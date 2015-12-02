'use strict';

var events = require('events');
var util = require('util');
var winston = require('winston');
require('winston-mongodb');
require('winston-logstash');

var acegikLogger = require('./lib/logger.js');

var acegikLevels = {
  levels: {
    debug: 4,
    info: 3,
    trace: 2,
    warn: 1,
    error: 0
  },
  colors: {
    debug: 'blue',
    info: 'green',
    trace: 'yellow',
    warn: 'cyan',
    error: 'red'
  }
};

var defaultLogLevel = 'error';

var NODE_ENV = process.env.NODE_ENV;

if (NODE_ENV && NODE_ENV != 'production') {
  defaultLogLevel = 'trace';
}

var Service = function(params) {
  params = params || {};
  
  var loggerConfig = params.logger || {};
  
  var self = this;
  
  var transports = [];
  var transportDefs = loggerConfig.transports || [];
  transportDefs.forEach(function(transportDef) {
    var transportLevel = transportDef.level || 'error';
    switch(transportDef.type) {
      case 'console':
        transports.push(new winston.transports.Console({
          json: false,
          timestamp: true,
          colorize: true,
          level: transportLevel
        }));
        break;
      case 'file':
        transports.push(new winston.transports.File({
          json: false,
          timestamp: true,
          tailable: transportDef.tailable || true,
          zippedArchive: transportDef.zippedArchive || true,
          filename: transportDef.filename || 'logfile.log',
          maxsize: transportDef.maxsize || 3 * 1024 * 1024,
          maxFiles: transportDef.maxFiles || 3,
          level: transportLevel
        }));
        break;
      case 'logstash':
        transports.push(new winston.transports.Logstash({
          host: transportDef.host || '127.0.0.1',
          port: transportDef.port || 28777,
          max_connect_retries: 7,
          timeout_connect_retries: 100,
          node_name: 'my node name',
          level: transportLevel
        }));
        break;
      case 'mongodb':
        var mongo_url = util.format('mongodb://%s:%s/%s',
            transportDef.host || '127.0.0.1',
            transportDef.port || 27017,
            transportDef.name || 'applogs');
        transports.push(new winston.transports.MongoDB({
          db: mongo_url,
          storeHost: true,
          level: transportLevel
        }));
        break;
    }
  });

  if (transports.length == 0) {
    transports.push(new winston.transports.Console({
      json: false,
      timestamp: true,
      colorize: true,
      handleExceptions: true,
      level: defaultLogLevel
    }));
  }

  var logger = new acegikLogger({
    levels: acegikLevels.levels,
    colors: acegikLevels.colors,
    transports: transports,
    exceptionHandlers: transports,
    exitOnError: false
  });

  self.getLogger = function() {
    return logger;
  };
};

util.inherits(Service, events.EventEmitter);

module.exports = Service;

Service.defaultLogger = (new Service()).getLogger();

Service.prototype.defaultLogger = Service.defaultLogger;
