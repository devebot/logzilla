'use strict';

var events = require('events');
var util = require('util');

var Validator = require('jsonschema').Validator;
var validator = new Validator();

var winston = require('winston');

require('winston-daily-rotate-file');
require('winston-logstash');

var constructors = {
  'console': winston.transports.Console,
  'file': winston.transports.File,
  'dailyRotateFile': winston.transports.DailyRotateFile,
  'logstash': winston.transports.Logstash
};

var Consts = require('./constx.js');
var Logger = require('./logger.js');

var defaultLogLevel = 'error';
var NODE_ENV = process.env.NODE_ENV;
if (NODE_ENV && NODE_ENV != 'production') {
  defaultLogLevel = 'trace';
}

var Service = function(params) {
  events.EventEmitter.call(this);
  
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
  
  var defaultTransports = [
    new winston.transports.Console({
      json: false,
      timestamp: true,
      colorize: true,
      level: defaultLogLevel
    })
  ];

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
    transports = defaultTransports;
  }

  var logger = new Logger({
    levels: Consts.levelDefs.levels,
    colors: Consts.levelDefs.colors,
    transports: transports,
    exceptionHandlers: defaultTransports,
    exitOnError: false
  });

  logger.activate(false, disabledTransports);

  self.getLogger = function() {
    return logger;
  };
  
  self.getServiceInfo = function() {
    return {
      levels: Consts.levelDefs.levels,
      colors: Consts.levelDefs.colors,
      transports: logger.getTransportInfos(),
      disabledTransports: disabledTransports
    };
  };

  self.getServiceHelp = function() {
    var info = this.getServiceInfo();
    return {
      type: 'record',
      title: 'Logdapter information',
      label: {
        logger_levels: 'Levels',
        logger_colors: 'Colors',
        transports: 'Defined transports',
        disabled_transport_names: 'Disabled transports'
      },
      data: {
        logger_levels: JSON.stringify(info.levels, null, 2),
        logger_colors: JSON.stringify(info.colors, null, 2),
        transports: JSON.stringify(info.transports, null, 2),
        disabled_transport_names: info.disabledTransports
      }
    };
  };
};

util.inherits(Service, events.EventEmitter);

Service.argumentSchema = Consts.argumentSchema;

module.exports = Service;
