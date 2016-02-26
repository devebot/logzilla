'use strict';

var debug = require('debug')('logdapter-logger');
var util = require('util');
var winston = require('winston');

function Logger() {
  Logger.super_.apply(this, arguments);
  
  var self = this;
  var defaultLevels = {};
  var transportMap = {};
  
  if (this.transports) {
    var transportKeys = Object.keys(self.transports);
    transportKeys.forEach(function(key) {
      defaultLevels[key] = self.transports[key].level;
      transportMap[key] = {
        enabled: true,
        ref: self.transports[key]
      };
    });
  }
  
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

    debug('activate(%s, %s): the logger.transports before processing: %s', 
      enabled, JSON.stringify(transportNames), JSON.stringify(Object.keys(this.transports)));

    transportNames = transportNames || [];
    if (!(transportNames instanceof Array)) {
      transportNames = [transportNames];
    }
    
    transportNames.forEach(function(name) {
      if (transportMap[name]) {
        transportMap[name].enabled = !(enabled == false);
      }
    });
    
    var transportKeys = Object.keys(transportMap);
    transportKeys.forEach(function(key) {
      if (this.transports[key]) {
        this.remove(key);
      }
      if (transportMap[key].enabled) {
        this.add(transportMap[key].ref, null, true);
      }
    }, this);

    debug('activate(%s, %s): the logger.transports after processing: %s', 
      enabled, JSON.stringify(transportNames), JSON.stringify(Object.keys(this.transports)));
  };
}

util.inherits(Logger, winston.Logger);

Logger.prototype.setLevel = function(level, transportName) {
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

Logger.prototype.isLevelEnabled = function(level) {
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

module.exports = Logger;
