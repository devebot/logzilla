var util = require('util');
var assert = require('chai').assert;

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
		  var result = validator.validate({
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
	    }, Logdapter.argumentSchema);
	    
	    assert.lengthOf(result.errors, 0);
	    
      done && done();
		});

	});
});