var sanitize = require('./util').sanitize,
  sanitizeOptions = require('./util').sanitizeOptions,
  getUrlStringfromUrlObject = require('./util').getUrlStringfromUrlObject,
  addFormParam = require('./util').addFormParam,
  form = require('./util').form,
  _ = require('./lodash'),
  self;

self = module.exports = {
  convert: function (request, options, callback) {

    if (!_.isFunction(callback)) {
      throw new Error('Curl-Converter: callback is not valid function');
    }
    options = sanitizeOptions(options, self.getOptions());

    var indent, trim, headersData, body, redirect, timeout, multiLine,
      format, snippet, silent, url, shellType, lineContinuationCharacter, quoteType;

    redirect = options.followRedirect;
    timeout = options.requestTimeout;
    multiLine = options.multiLine;
    format = options.longFormat;
    trim = options.trimRequestBody;
    silent = options.silent;
    shellType = options.shellType;

    switch (shellType) {
      case 'cmd.exe':
        lineContinuationCharacter = '^';
        quoteType = '"';
        break;
      case 'powershell':
        lineContinuationCharacter = '`';
        quoteType = '\'';
        break;
      default:
        lineContinuationCharacter = '\\';
        quoteType = '\'';
        break;
    }

    snippet = silent ? `curl ${form('-s', format)}` : 'curl';
    if (redirect) {
      snippet += ` ${form('-L', format)}`;
    }
    if (timeout > 0) {
      snippet += ` ${form('-m', format)} ${timeout}`;
    }
    if (multiLine) {
      indent = options.indentType === 'Tab' ? '\t' : ' ';
      indent = ' ' + lineContinuationCharacter + '\n' + indent.repeat(options.indentCount); // eslint-disable-line max-len
    }
    else {
      indent = ' ';
    }
    url = getUrlStringfromUrlObject(request.url);
    if (request.method === 'HEAD') {
      snippet += ` ${form('-I', format)} ${quoteType + url + quoteType}`;
    }
    else {
      snippet += ` ${form('-X', format)} ${request.method} ${quoteType + url + quoteType}`;
    }

    if (request.body && !request.headers.has('Content-Type')) {
      if (request.body.mode === 'file') {
        request.addHeader({
          key: 'Content-Type',
          value: 'text/plain'
        });
      }
      else if (request.body.mode === 'graphql') {
        request.addHeader({
          key: 'Content-Type',
          value: 'application/json'
        });
      }
    }
    headersData = request.toJSON().header;
    if (headersData) {
      headersData = _.reject(headersData, 'disabled');
      _.forEach(headersData, (header) => {
        snippet += indent + `${form('-H', format)} ${quoteType + sanitize(header.key, true)}:`;
        snippet += ` ${sanitize(header.value) + quoteType}`;
      });
    }

    // The following code handles multiple files in the same formdata param.
    // It removes the form data params where the src property is an array of filepath strings
    // Splits that array into different form data params with src set as a single filepath string
    if (request.body && request.body.mode === 'formdata') {
      let formdata = request.body.formdata,
        formdataArray = [];
      formdata.members.forEach((param) => {
        let key = param.key,
          type = param.type,
          disabled = param.disabled,
          contentType = param.contentType;
        if (type === 'file') {
          if (typeof param.src !== 'string') {
            if (Array.isArray(param.src) && param.src.length) {
              param.src.forEach((filePath) => {
                addFormParam(formdataArray, key, param.type, filePath, disabled, contentType);
              });
            }
            else {
              addFormParam(formdataArray, key, param.type, '/path/to/file', disabled, contentType);
            }
          }
          else {
            addFormParam(formdataArray, key, param.type, param.src, disabled, contentType);
          }
        }
        else {
          addFormParam(formdataArray, key, param.type, param.value, disabled, contentType);
        }
      });
      request.body.update({
        mode: 'formdata',
        formdata: formdataArray
      });
    }
    if (request.body) {
      body = request.body.toJSON();

      if (!_.isEmpty(body)) {
        switch (body.mode) {
          case 'urlencoded':
            _.forEach(body.urlencoded, function (data) {
              if (!data.disabled) {
                // Using the long form below without considering the longFormat option,
                // to generate more accurate and correct snippet
                snippet += indent + '--data-urlencode';
                snippet += ` ${quoteType + sanitize(data.key, trim)}=${sanitize(data.value, trim) + quoteType}`;
              }
            });
            break;
          case 'raw':
            snippet += indent + `--data-raw ${quoteType + sanitize(body.raw.toString(), trim) + quoteType}`;
            break;
          case 'graphql':
            // eslint-disable-next-line no-case-declarations
            let query = body.graphql.query,
              graphqlVariables;
            try {
              graphqlVariables = JSON.parse(body.graphql.variables);
            }
            catch (e) {
              graphqlVariables = {};
            }
            snippet += indent + `--data-raw ${quoteType + sanitize(JSON.stringify({
              query: query,
              variables: graphqlVariables
            }), trim) + quoteType}`;
            break;
          case 'formdata':
            _.forEach(body.formdata, function (data) {
              if (!(data.disabled)) {
                if (data.type === 'file') {
                  snippet += indent + `${form('-F', format)}`;
                  snippet += ` ${quoteType + sanitize(data.key, trim)}=@${sanitize(data.src, trim) + quoteType}`;
                }
                else {
                  snippet += indent + `${form('-F', format)}`;
                  snippet += ` ${quoteType + sanitize(data.key, trim)}=${sanitize(data.value, trim) + quoteType}`;
                }
              }
            });
            break;
          case 'file':
            snippet += indent + '--data-binary';
            snippet += ` ${quoteType}@${sanitize(body[body.mode].src, trim) + quoteType}`;
            break;
          default:
            break;
        }
      }
    }
    callback(null, snippet);
  },
  getOptions: function () {
    return [
      {
        name: 'Generate multiline snippet',
        id: 'multiLine',
        type: 'boolean',
        default: true,
        description: 'Split cURL command across multiple lines'
      },
      {
        name: 'Use long form options',
        id: 'longFormat',
        type: 'boolean',
        default: true,
        description: 'Use the long form for cURL options (--header instead of -H)'
      },
      {
        name: 'Shell type',
        id: 'shellType',
        availableOptions: ['sh', 'cmd.exe', 'powershell'],
        type: 'enum',
        default: 'sh',
        description: 'Set the shell where curl will be run. This will set the appropriate type for ' +
          'quotes (\' or ") and line continuation character (\\, ^ or `)'
      },
      {
        name: 'Set request timeout',
        id: 'requestTimeout',
        type: 'positiveInteger',
        default: 0,
        description: 'Set number of milliseconds the request should wait for a response before ' +
          'timing out (use 0 for infinity)'
      },
      {
        name: 'Follow redirects',
        id: 'followRedirect',
        type: 'boolean',
        default: true,
        description: 'Automatically follow HTTP redirects'
      },
      {
        name: 'Trim request body fields',
        id: 'trimRequestBody',
        type: 'boolean',
        default: false,
        description: 'Remove white space and additional lines that may affect the server\'s response'
      },
      {
        name: 'Use Silent Mode',
        id: 'silent',
        type: 'boolean',
        default: false,
        description: 'Display the requested data without showing the cURL progress meter or error messages'
      }
    ];
  }
};
