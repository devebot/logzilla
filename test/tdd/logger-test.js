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
var Consts = require('../../lib/constx.js');

var LOG_MSGS = {
  'error': 'I have an error',
  'warn': 'dangerous!',
  'trace': 'Hello logzilla',
  'info': 'Today is Friday',
  'debug': 'This is a bug'
};

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
        levels: Consts.levelDefs.levels,
        colors: Consts.levelDefs.colors,
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
        levels: Consts.levelDefs.levels,
        colors: Consts.levelDefs.colors,
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

      assert.equal('trace', logger.getTransportInfo('console').level);
      assert.equal('info', logger.getTransportInfo('dailyRotateFile').level);

      assert.isTrue(logger.isLevelEnabled('error'));
      assert.isTrue(logger.isLevelEnabled('warn'));
      assert.isTrue(logger.isLevelEnabled('trace'));
      assert.isTrue(logger.isLevelEnabled('info'));
      assert.isFalse(logger.isLevelEnabled('debug'));

      var unhook_intercept = intercept(function(txt) {
          consoleOutput.push(txt.trim());
      });

      Object.keys(LOG_MSGS).forEach(function(level) {
        logger[level](LOG_MSGS[level]);
      });

      unhook_intercept();
      assert.equal(consoleOutput.length, 3);

      var rotateOutput = logStream.getContentsAsString() || '';
      var rotateLines = rotateOutput.split('\n').filter(function(line) {
        return (typeof line === 'string') && line.trim().length > 0;
      });

      false && console.log(rotateLines);
      assert.equal(rotateLines.length, 4);

      done && done();
    });

    it('should keep the current transports level if the new level is invalid', function(done) {
      logger.setLevel('invalid', 'console');
      logger.setLevel('invalid', 'dailyRotateFile');

      assert.equal('warn', logger.getTransportInfo('console').level);
      assert.equal('trace', logger.getTransportInfo('dailyRotateFile').level);

      done && done();
    });
  });
  
  describe('method activate()', function() {
    var normalFileStream, rotateFileStream, consoleInterceptor, consoleOutput;

    beforeEach(function (done) {
      normalFileStream = new streamBuffers.WritableStreamBuffer();
      rotateFileStream = new streamBuffers.WritableStreamBuffer();
      consoleOutput = [];

      var transports = [
        new winston.transports.Console({
          type: "console",
          level: "trace",
          json: false,
          timestamp: true,
          colorize: false
        }),
        new winston.transports.DailyRotateFile({
          name: 'myRotateFile',
          type: 'dailyRotateFile',
          level: 'warn',
          json: false,
          stream: rotateFileStream
        }),
        new winston.transports.File({
          type: 'file',
          level: 'error',
          json: false,
          stream: normalFileStream
        })
      ];

      logger = new Logger({
        levels: Consts.levelDefs.levels,
        colors: Consts.levelDefs.colors,
        transports: transports,
        exceptionHandlers: transports,
        exitOnError: false
      });

      done && done();
    });

    it('enable/disable registered logging transports', function(done) {

      // log with original settings
      consoleInterceptor = intercept(function(txt) {
          consoleOutput.push(txt.trim());
      });

      Object.keys(LOG_MSGS).forEach(function(level) {
        logger[level](LOG_MSGS[level]);
      });

      consoleInterceptor();

      var rotateOutput = rotateFileStream.getContentsAsString() || '';
      var rotateLines = rotateOutput.split('\n').filter(function(line) {
        return (typeof line === 'string') && line.trim().length > 0;
      });
      false && console.log(rotateLines);

      var normalOutput = normalFileStream.getContentsAsString() || '';
      var normalLines = normalOutput.split('\n').filter(function(line) {
        return (typeof line === 'string') && line.trim().length > 0;
      });
      false && console.log(normalLines);

      assert.equal(rotateLines.length, 2);
      assert.equal(normalLines.length, 1);
      assert.equal(consoleOutput.length, 3);
      consoleOutput.length = 0;

      // deactivate some transports
      logger.activate(false, ['myRotateFile', 'file']);

      consoleInterceptor = intercept(function(txt) {
          consoleOutput.push(txt.trim());
      });

      Object.keys(LOG_MSGS).forEach(function(level) {
        logger[level](LOG_MSGS[level]);
      });

      consoleInterceptor();

      rotateOutput = rotateFileStream.getContentsAsString() || '';
      rotateLines = rotateOutput.split('\n').filter(function(line) {
        return (typeof line === 'string') && line.trim().length > 0;
      });
      false && console.log(rotateLines);

      normalOutput = normalFileStream.getContentsAsString() || '';
      normalLines = normalOutput.split('\n').filter(function(line) {
        return (typeof line === 'string') && line.trim().length > 0;
      });
      false && console.log(normalLines);

      assert.equal(rotateLines.length, 0);
      assert.equal(normalLines.length, 0);
      assert.equal(consoleOutput.length, 3);
      consoleOutput.length = 0;

      // reactivate a disabled transport
      logger.activate(true, ['file']);

      consoleInterceptor = intercept(function(txt) {
          consoleOutput.push(txt.trim());
      });

      Object.keys(LOG_MSGS).forEach(function(level) {
        logger[level](LOG_MSGS[level]);
      });

      consoleInterceptor();

      rotateOutput = rotateFileStream.getContentsAsString() || '';
      rotateLines = rotateOutput.split('\n').filter(function(line) {
        return (typeof line === 'string') && line.trim().length > 0;
      });
      false && console.log(rotateLines);

      normalOutput = normalFileStream.getContentsAsString() || '';
      normalLines = normalOutput.split('\n').filter(function(line) {
        return (typeof line === 'string') && line.trim().length > 0;
      });
      false && console.log(normalLines);

      assert.equal(rotateLines.length, 0);
      assert.equal(normalLines.length, 1);
      assert.equal(consoleOutput.length, 3);
      consoleOutput.length = 0;

      done && done();
    });
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
        levels: Consts.levelDefs.levels,
        colors: Consts.levelDefs.colors,
        transports: transports,
        exceptionHandlers: transports,
        exitOnError: false
      });
    });

    it('logger write log messages to rotate file', function(done) {
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

      Object.keys(LOG_MSGS).forEach(function(level) {
        logger[level](LOG_MSGS[level]);
      });

      setTimeout(function() {
        var rotateOutput = fs.readFileSync(path.join(logDir.name, logFilename)).toString() || '';
        var rotateLines = rotateOutput.split('\n').filter(function(line) {
          return (typeof line === 'string') && line.trim().length > 0;
        });

        false && console.log(rotateLines);
        assert.equal(rotateLines.length, 4);

        done && done();
      }, 100);
    });

    afterEach(function() {
      logDir.removeCallback();
    });
  });
});