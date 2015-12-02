'use strict';

var lodash = require('lodash');
var util = require('util');
var winston = require('winston');

function Logger() {
  Logger.super_.apply(this, arguments);
  
  var defaultLevels = {};
  
  lodash.forEach(this.transports, function(transport) {
    defaultLevels[transport.name] = transport.level;
  }, this);
  
  this.resetDefaultLevels = function() {
    lodash.forEach(this.transports, function(transport) {
      var defaultLevel = defaultLevels[transport.name];
      if (defaultLevel && this.levels[defaultLevel]) {
        transport.level = defaultLevel;
      }
    }, this);
  };
}

util.inherits(Logger, winston.Logger);

Logger.prototype.setLevel = function(level, transportName) {
  var transportNames = [];

  if (lodash.isString(transportName) && !lodash.isEmpty(transportName)) {
    transportNames.push(transportName);
  } else if (lodash.isArray(transportName)) {
    transportNames = transportName; 
  }

  lodash.forEach(this.transports, function(transport) {
    if (transportNames.length == 0 || transportNames.indexOf(transport.name) >= 0) {
      transport.level = level;
    }
  }, this);
};

Logger.prototype.isLevelEnabled = function(level) {
  return lodash.any(this.transports, function(transport) {
    return (transport.level && this.levels[transport.level] <= this.levels[level])
      || (!transport.level && this.levels[this.level] <= this.levels[level]);
  }, this);
};

module.exports = Logger;