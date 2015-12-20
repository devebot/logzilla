'use strict';

var events = require('events');
var util = require('util');

var Validator = require('jsonschema').Validator;
var validator = new Validator();

var winston = require('winston');

var DailyRotateFile = require('winston-daily-rotate-file');
winston.transports.DailyRotateFile = DailyRotateFile;

require('winston-mongodb');
require('winston-logstash');

var constructors = {
  'console': winston.transports.Console,
  'file': winston.transports.File,
  'dailyRotateFile': winston.transports.DailyRotateFile,
  'logstash': winston.transports.Logstash,
  'mongodb': winston.transports.MongoDB
};

var logdapterLogger = require('./lib/logger.js');
var logdapterConsts = require('./lib/constx.js');

var defaultLogLevel = 'error';
var NODE_ENV = process.env.NODE_ENV;
if (NODE_ENV && NODE_ENV != 'production') {
  defaultLogLevel = 'trace';
}

var Service = function(params) {
  Service.super_.call(this);
  
  params = params || {};
  
  if (params.validated != true) {
    var result = validator.validate(params, Service.argumentSchema);
    if (result.errors.length > 0) {
      var err = new Error('Constructor argument validation is failed');
      err.name = 'ValidatingArgumentError';
      throw err;
    }
  }
  
  var loggerConfig = params.logger || {};
  
  var self = this;
  
  var transports = [];
  var disabledTransports = [];
  var transportDefs = loggerConfig.transports || [];
  transportDefs.forEach(function(transportDef) {
    transports.push(new constructors[transportDef.type](transportDef));
    if (transportDef.enabled == false) {
      disabledTransports.push(transportDef.type);
    }
  });

  if (transports.length == 0) {
    transports.push(new winston.transports.Console({
      json: false,
      timestamp: true,
      colorize: true,
      level: defaultLogLevel
    }));
  }

  var logger = new logdapterLogger({
    levels: logdapterConsts.levelDefs.levels,
    colors: logdapterConsts.levelDefs.colors,
    transports: transports,
    exceptionHandlers: transports,
    exitOnError: false
  });

  logger.activate(false, disabledTransports);

  self.getLogger = function() {
    return logger;
  };
};

util.inherits(Service, events.EventEmitter);

Service.argumentSchema = logdapterConsts.argumentSchema;

module.exports = Service;

Service.defaultLogger = (new Service()).getLogger();

Service.prototype.defaultLogger = Service.defaultLogger;
