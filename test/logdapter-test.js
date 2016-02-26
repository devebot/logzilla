var util = require('util');
var assert = require('chai').assert;
var expect = require('chai').expect;

var Validator = require('jsonschema').Validator;
var validator = new Validator();

var Logdapter = require('../index.js');
var logdapter;

describe('Logdapter:', function() {

  describe('Constructor argument schema', function() {

    beforeEach(function (done) {
      done && done();
    });

    afterEach(function(done) {
      done && done();
    });

    it('should be passed if arguments is valid with argumentSchema', function(done) {
      expect(function() {
        logdapter = new Logdapter({
          logger: {
            transports: [{
              type: "console",
              json: false,
              timestamp: true,
              colorize: true,
              level: "debug"
            },{
              type: "logstash",
              host: "127.0.0.1",
              port: 28777,
              level: "debug"
            },{
              type: "mongodb",
              db: "mongodb://127.0.0.1:27017/logs",
              storeHost: true,
              level: "debug"
            }]
          }
        });  
      }).to.not.throw(Error);
      done && done();
    });

    it('should be failed if transport type is not found', function(done) {
      expect(function() {
        logdapter = new Logdapter({
          logger: {
            transports: [{
              type: "console2",
              json: false,
              timestamp: true,
              colorize: true,
              level: "debug"
            },{
              type: "logstash",
              host: "127.0.0.1",
              port: 28777,
              level: "debug"
            }]
          }
        });  
      }).to.throw(Error);
      done && done();
    });
  });
});