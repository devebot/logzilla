'use strict';

var util = require('util');
var assert = require('chai').assert;
var fs = require('fs');
var path = require('path');
var tmp = require('tmp');
var dateFormat = require('dateformat');
var intercept = require('intercept-stdout');
var streamBuffers = require('stream-buffers');
var winston = require('winston');
require('winston-daily-rotate-file');
require('winston-logstash');

var Logger = require('../../lib/logger.js');
var consts = require('../../lib/constx.js');

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
    var logStream, consoleOutput;

    beforeEach(function (done) {
      logStream = new streamBuffers.WritableStreamBuffer();
      consoleOutput = [];

      var transports = [
        new winston.transports.Console({
          type: "console",
          level: "warn",
          json: false,
          timestamp: true,
          colorize: false
        }),
        new winston.transports.DailyRotateFile({
          type: 'dailyRotateFile',
          level: 'trace',
          json: false,
          stream: logStream
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

    it('should change all transports level to new level', function(done) {
      assert.isTrue(logger.isLevelEnabled('error'));
      assert.isTrue(logger.isLevelEnabled('warn'));
      assert.isTrue(logger.isLevelEnabled('trace'));
      assert.isFalse(logger.isLevelEnabled('info'));
      assert.isFalse(logger.isLevelEnabled('debug'));

      logger.setLevel('trace', 'console');
      logger.setLevel('info', 'dailyRotateFile');

      assert.equal('trace', logger.transports['console'].level);
      assert.equal('info', logger.transports['dailyRotateFile'].level);

      assert.isTrue(logger.isLevelEnabled('error'));
      assert.isTrue(logger.isLevelEnabled('warn'));
      assert.isTrue(logger.isLevelEnabled('trace'));
      assert.isTrue(logger.isLevelEnabled('info'));
      assert.isFalse(logger.isLevelEnabled('debug'));

      var unhook_intercept = intercept(function(txt) {
          consoleOutput.push(txt.trim());
      });

      var logtexts = {
        'error': 'I have an error',
        'warn': 'dangerous!',
        'trace': 'Hello logzilla',
        'info': 'Today is Friday',
        'debug': 'This is a bug'
      };

      Object.keys(logtexts).forEach(function(level) {
        logger[level](logtexts[level]);
      });

      unhook_intercept();
      assert.equal(consoleOutput.length, 3);

      var streamOutput = logStream.getContentsAsString() || '';
      var streamLines = streamOutput.split('\n').filter(function(line) {
        return (typeof line === 'string') && line.trim().length > 0;
      });

      false && console.log(streamLines);
      assert.equal(streamLines.length, 4);

      done && done();
    });

    it('should keep the current transports level if the new level is invalid', function(done) {
      logger.setLevel('invalid', 'console');
      logger.setLevel('invalid', 'dailyRotateFile');
      
      assert.equal('warn', logger.transports['console'].level);
      assert.equal('trace', logger.transports['dailyRotateFile'].level);
      
      done && done();
    });
  });
  
  describe('method activate()', function() {
    
  });

  describe('transport DailyRotateFile', function() {
    var logDir, logFilename;

    beforeEach(function () {
      tmp.setGracefulCleanup();
      logDir = tmp.dirSync({unsafeCleanup: true});
      logFilename = 'dailyfile.log.' + dateFormat(new Date(), "yyyy-mm-dd");

      var transports = [
        new winston.transports.DailyRotateFile({
          type: 'dailyRotateFile',
          level: 'trace',
          json: false,
          datePattern: '.yyyy-MM-dd',
          filename: path.join(logDir.name, 'dailyfile.log')
        })
      ];

      logger = new Logger({
        levels: consts.levelDefs.levels,
        colors: consts.levelDefs.colors,
        transports: transports,
        exceptionHandlers: transports,
        exitOnError: false
      });
    });

    it('should change all transports level to new level', function(done) {
      assert.isTrue(logger.isLevelEnabled('error'));
      assert.isTrue(logger.isLevelEnabled('warn'));
      assert.isTrue(logger.isLevelEnabled('trace'));
      assert.isFalse(logger.isLevelEnabled('info'));
      assert.isFalse(logger.isLevelEnabled('debug'));

      logger.setLevel('info', 'dailyRotateFile');

      assert.isTrue(logger.isLevelEnabled('error'));
      assert.isTrue(logger.isLevelEnabled('warn'));
      assert.isTrue(logger.isLevelEnabled('trace'));
      assert.isTrue(logger.isLevelEnabled('info'));
      assert.isFalse(logger.isLevelEnabled('debug'));

      var logtexts = {
        'error': 'I have an error',
        'warn': 'dangerous!',
        'trace': 'Hello logzilla',
        'info': 'Today is Friday',
        'debug': 'This is a bug'
      };

      Object.keys(logtexts).forEach(function(level) {
        logger[level](logtexts[level]);
      });

      setTimeout(function() {
        var streamOutput = fs.readFileSync(path.join(logDir.name, logFilename)).toString() || '';
        var streamLines = streamOutput.split('\n').filter(function(line) {
          return (typeof line === 'string') && line.trim().length > 0;
        });

        false && console.log(streamLines);
        assert.equal(streamLines.length, 4);

        done && done();
      }, 100);
    });

    afterEach(function() {
      logDir.removeCallback();
    });
  });
});