'use strict';

var util = require('util');
var winston = require('winston');
var pinbug = require('./pinbug')('logzilla:Logger');

function Logger() {
  winston.Logger.apply(this, arguments);
  
  var self = this;
  var defaultLevels = {};
  
  if (this.transports) {
    var transportKeys = Object.keys(self.transports);
    transportKeys.forEach(function(key) {
      defaultLevels[key] = self.transports[key].level;
    });
  }

  this.setLevel = function(level, transportName) {
    var transportNames = [];
    if ((typeof transportName == 'string') || (transportName instanceof String)) {
      transportNames.push(transportName);
    } else if (transportName instanceof Array) {
      transportNames = transportName;
    }

    var transportKeys = Object.keys(this.transports);
    transportKeys.forEach(function(key) {
      if ((transportNames.length == 0 || transportNames.indexOf(key) >= 0) &&
          this.levels[level]) {
        this.transports[key].level = level;
      }
    }, this);
  };

  this.isEnabledFor = function(level) {
    var transportKeys = Object.keys(this.transports);
    for(var i=0; i<transportKeys.length; i++) {
      var key = transportKeys[i];
      var transport = this.transports[key];
      if ((transport.level && this.levels[transport.level] >= this.levels[level]) ||
          (!transport.level && this.levels[this.level] >= this.levels[level])) {
        return true;
      }
    }
    return false;
  };

  this.isLevelEnabled = this.isEnabledFor;

  this.resetDefaultLevels = function() {
    var transportKeys = Object.keys(this.transports);
    transportKeys.forEach(function(key) {
      var defaultLevel = defaultLevels[key];
      if (defaultLevel && this.levels[defaultLevel]) {
        this.transports[key].level = defaultLevel;
      }
    }, this);
  };
  
  this.activate = function(enabled, transportNames) {
    if (enabled == null) return;

    pinbug.enabled && pinbug('activate(%s, %s): the logger.transports before processing: %s',
      enabled, JSON.stringify(transportNames), JSON.stringify(Object.keys(this.transports)));

    transportNames = transportNames || [];
    if (!(transportNames instanceof Array)) {
      transportNames = [transportNames];
    }
    
    transportNames.forEach(function(name) {
      if (this.transports[name]) {
        this.transports[name].silent = (enabled == false);
      }
    }, this);

    pinbug.enabled && pinbug('activate(%s, %s): the logger.transports after processing: %s',
      enabled, JSON.stringify(transportNames), JSON.stringify(Object.keys(this.transports)));
  };
  
  this.getTransportInfo = function(transportName) {
    var item = this.transports[transportName];
    var transportInfo = item && {
      enabled: !(item.silent),
      name: item.name,
      level: item.level,
      json: item.json,
      silent: item.silent,
      handleExceptions: item.handleExceptions,
      timestamp: item.timestamp,
      colorize: item.colorize
    }
    return transportInfo;
  }

  this.getTransportInfos = function() {
    return Object.keys(this.transports).map(function(key) {
      return this.getTransportInfo(key);
    }, this);
  };
}

util.inherits(Logger, winston.Logger);

module.exports = Logger;
