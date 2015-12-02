# logdapter

[![NPM](https://nodei.co/npm/logdapter.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/logdapter/)

The simple winston based logging adapter using in devebot.

## Usage

Installs `logdapter` module:

```bash
$ npm install --save logdapter
```

Creates a logdapter object and initializes it:

```javascript
var Logdapter = require('../index.js');
var logdapter = new Logdapter({
  logger: {
    transports: [{
      type: 'console',
      level: 'trace'
    }, {
      type: 'logstash',
      level: 'trace',
      host: '127.0.0.1',
      port: 28777
    }]
  }
});
var logger = logdapter.getLogger();
```

Uses the helper methods to log messages:

```javascript
logger.error(' - this is an error: %s', err);
logger.warn(' - alert: this record should be index again.');
logger.trace(' - marks the startpoint of process ...');
logger.info(' - object detail: %s', JSON.stringify(doc));
logger.debug(' - display data and process in details');
```

To change logger level at runtime, you should use the setLevel() method:

```javascript
// ... code that uses old loglevel

// set 'error' level to all transports
logger.setLevel('error');

// set 'trace' level to only 'console' transport
logger.setLevel('trace', 'console'); 

// set 'debug' level to both 'console' and 'mongodb' transports
logger.setLevel('debug', ['console', 'mongodb']);

// ... code that uses new loglevel
```

You can reset all logger transport levels to default levels:

```javascript
logger.resetDefaultLevels();
```
