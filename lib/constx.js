'use strict';

var logdapterLevels = {
  levels: {
    debug: 4,
    info: 3,
    trace: 2,
    warn: 1,
    error: 0
  },
  colors: {
    debug: 'blue',
    info: 'green',
    trace: 'yellow',
    warn: 'cyan',
    error: 'red'
  }
};

var level_enum = Object.keys(logdapterLevels.levels);

var logdapterSchema = {
  "type": "object",
  "properties": {
    "logger": { 
      "type": "object",
      "properties": {
        "transports": {
          "type": "array",
          "items": {
            "oneOf": [
              {
                "type": "object",
                "properties": {
                  "type" : {
                    "type": "string",
                    "enum": ["console"]
                  },
                  "level": {
                    "type": "string",
                    "enum": level_enum,
                    "default": "trace"
                  },
                  "enabled": {
                    "type": "boolean"
                  },
                  "name": {
                    "type": "string"
                  },
                  "json": {
                    "type": "boolean"
                  },
                  "colorize": {
                    "type": "boolean"
                  },
                  "timestamp": {
                    "type": "boolean"
                  }
                },
                "required": ["type"]
              },
              {
                "type": "object",
                "properties": {
                  "type" : {
                    "type": "string",
                    "enum": ["file"]
                  },
                  "level": {
                    "type": "string",
                    "enum": level_enum,
                    "default": "error"
                  },
                  "enabled": {
                    "type": "boolean"
                  },
                  "json": {
                    "type": "boolean"
                  },
                  "colorize": {
                    "type": "boolean"
                  },
                  "timestamp": {
                    "type": "boolean"
                  }
                },
                "required": ["type"]
              },
              {
                "type": "object",
                "properties": {
                  "type" : {
                    "type": "string",
                    "enum": ["dailyRotateFile"]
                  },
                  "level": {
                    "type": "string",
                    "enum": level_enum,
                    "default": "trace"
                  },
                  "enabled": {
                    "type": "boolean"
                  },
                  "json": {
                    "type": "boolean",
                    "default": false
                  },
                  "colorize": {
                    "type": "boolean"
                  },
                  "timestamp": {
                    "type": "boolean"
                  },
                  "datePattern": {
                    "type": "string",
                    "description": "Example: yyyy-MM-ddTHH"
                  },
                  "filename": {
                    "type": "string",
                    "description": "Example: dailyfile.log"
                  }
                },
                "required": ["type", "filename", "datePattern"]
              },
              {
                "type" : "object",
                "properties": {
                  "type" : {
                    "type": "string",
                    "enum": ["logstash"]
                  },
                  "level" : {
                    "type": "string",
                    "enum": level_enum
                  },
                  "enabled": {
                    "type": "boolean"
                  },
                  "host": {
                    "type": "string"
                  },
                  "port": {
                    "type": "integer"
                  },
                  "max_connect_retries": {
                    "type": "integer"
                  },
                  "timeout_connect_retries": {
                    "type": "integer"
                  }
                },
                "required": ["type", "host"]
              },
              {
                "type" : "object",
                "properties": {
                  "type" : {
                    "type": "string",
                    "enum": ["mongodb"]
                  },
                  "level" : {
                    "type": "string",
                    "enum": level_enum
                  },
                  "enabled": {
                    "type": "boolean"
                  },
                  "db": {
                    "type": "string"
                  },
                  "storeHost": {
                    "type": "boolean"
                  }
                },
                "required": ["type", "db"]
              }
            ]
          }
        }
      }
    }
  }
};

module.exports = {
  argumentSchema: logdapterSchema,
  levelDefs: logdapterLevels
};