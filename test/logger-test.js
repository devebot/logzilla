var util = require('util');
var assert = require('chai').assert;

var winston = require('winston');

var DailyRotateFile = require('winston-daily-rotate-file');
winston.transports.DailyRotateFile = DailyRotateFile;

var Logger = require('../lib/logger.js');
var consts = require('../lib/constx.js');

describe('Logger:', function() {

  var logger;

  describe('method isLevelEnabled()', function() {
    beforeEach(function (done) {
      var transports = [
        new winston.transports.Console({
          type: "console",
          level: "trace",
          json: false,
          timestamp: true,
          colorize: true
        }),
        new winston.transports.DailyRotateFile({
          type: 'dailyRotateFile',
          level: 'error',
          json: 'false',
          datePattern: '.yyyy-MM-ddTHH',
          filename: 'dailyfile.log'
        })
      ];
      
      logger = new Logger({
        levels: consts.levelDefs.levels,
        colors: consts.levelDefs.colors,
        transports: transports,
        exceptionHandlers: transports,
        exitOnError: false
      });
      
      done && done();
    });
    
    it('should return true if there is a transport that has level higher than', function(done) {
      assert.isTrue(logger.isLevelEnabled('error'));
      assert.isTrue(logger.isLevelEnabled('warn'));
      assert.isTrue(logger.isLevelEnabled('trace'));
      assert.isFalse(logger.isLevelEnabled('info'));
      assert.isFalse(logger.isLevelEnabled('debug'));
      
      done && done();
    });
  });

  describe('method setLevel()', function() {

    beforeEach(function (done) {
      var transports = [
        new winston.transports.Console({
          type: "console",
          level: "warn",
          json: false,
          timestamp: true,
          colorize: true
        }),
        new winston.transports.DailyRotateFile({
          type: 'dailyRotateFile',
          level: 'error',
          json: 'false',
          datePattern: '.yyyy-MM-ddTHH',
          filename: 'dailyfile.log'
        })
      ];
      
      logger = new Logger({
        levels: consts.levelDefs.levels,
        colors: consts.levelDefs.colors,
        transports: transports,
        exceptionHandlers: transports,
        exitOnError: false
      });
      
      done && done();
    });

    afterEach(function(done) {
      done && done();
    });

    it('should change all transports level to new level', function(done) {
      logger.setLevel('debug', 'console');
      logger.setLevel('trace', 'dailyRotateFile');
      
      assert.equal('debug', logger.transports['console'].level);
      assert.equal('trace', logger.transports['dailyRotateFile'].level);
      
      done && done();
    });

    it('should keep the current transports level if the new level is invalid', function(done) {
      logger.setLevel('invalid', 'console');
      logger.setLevel('invalid', 'dailyRotateFile');
      
      assert.equal('warn', logger.transports['console'].level);
      assert.equal('error', logger.transports['dailyRotateFile'].level);
      
      done && done();
    });
  });
  
  describe('method activate()', function() {
    
  });
});