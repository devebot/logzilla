'use strict';

var events = require('events');
var util = require('util');

var Validator = require('./validator');
var validator = new Validator();

var winston = require('winston');

require('winston-daily-rotate-file');
require('winston-logstash');

var constructors = {
  'console': winston.transports.Console,
  'file': winston.transports.File,
  'http': winston.transports.Http,
  'dailyRotateFile': winston.transports.DailyRotateFile,
  'logstash': winston.transports.Logstash
};

var Consts = require('./consts.js');
var Logger = require('./logger.js');

var defaultTransports = [
  new winston.transports.Console({
    json: false,
    timestamp: true,
    colorize: true,
    level: Consts.defaultLevel
  })
];

var Service = function(params) {
  events.EventEmitter.call(this);

  var self = this;

  params = params || {};
  
  if (params.validated != true) {
    var result = validator.validate(params, Service.argumentSchema);
    if (!result.ok) {
      var err = new Error('Constructor argument validation is failed');
      err.name = 'ValidatingArgumentError';
      throw err;
    }
  }
  
  var loggerConfig = params.logger || {};

  // defines levels & colors
  var __levels = loggerConfig.levels || Consts.levelDefs.levels;
  var __colors = loggerConfig.colors || Consts.levelDefs.colors;

  // defines transports
  var __transports = [];
  var disabledTransports = [];
  var transportDefs = loggerConfig.transports || [];
  transportDefs.forEach(function(transportDef) {
    __transports.push(new constructors[transportDef.type](transportDef));
    if (transportDef.enabled == false || transportDef.silent == true) {
      disabledTransports.push(transportDef.name || transportDef.type);
    }
  });

  if (__transports.length == 0) {
    __transports.push.apply(__transports, defaultTransports);
  }

  // create logger object
  var loggerOpts = {
    levels: __levels,
    colors: __colors,
    transports: __transports,
    exitOnError: false
  };
  if (loggerConfig.exceptionCaught) {
    loggerOpts.exceptionHandlers = defaultTransports;
  }
  var logger = new Logger(loggerOpts);

  logger.activate(false, disabledTransports);

  self.getLogger = function() {
    return logger;
  };
  
  self.getServiceInfo = function() {
    return {
      levels: __levels,
      colors: __colors,
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
