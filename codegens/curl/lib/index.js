var sanitize = require('./util').sanitize,
  sanitizeOptions = require('./util').sanitizeOptions,
  getUrlStringfromUrlObject = require('./util').getUrlStringfromUrlObject,
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
      format, snippet, silent, url;

    redirect = options.followRedirect;
    timeout = options.requestTimeout;
    multiLine = options.multiLine;
    format = options.longFormat;
    trim = options.trimRequestBody;
    silent = options.silent;

    snippet = silent ? `curl ${form('-s', format)}` : 'curl';
    if (redirect) {
      snippet += ` ${form('-L', format)}`;
    }
    if (timeout > 0) {
      snippet += ` ${form('-m', format)} ${timeout}`;
    }
    if (multiLine) {
      indent = options.indentType === 'Tab' ? '\t' : ' ';
      indent = ' ' + options.lineContinuationCharacter + '\n' + indent.repeat(options.indentCount); // eslint-disable-line max-len
    }
    else {
      indent = ' ';
    }
    url = getUrlStringfromUrlObject(request.url);
    if (request.method === 'HEAD') {
      snippet += ` ${form('-I', format)} "${url}"`;
    }
    else {
      snippet += ` ${form('-X', format)} ${request.method} "${url}"`;
    }

    if (request.body && request.body.mode === 'file' && !request.headers.has('Content-Type')) {
      request.addHeader({
        key: 'Content-Type',
        value: 'text/plain'
      });
    }
    headersData = request.getHeaders({ enabled: true });
    _.forEach(headersData, function (value, key) {
      snippet += indent + `${form('-H', format)} "${sanitize(key, trim)}: ${sanitize(value, trim)}"`;
    });

    if (request.body) {
      body = request.body.toJSON();

      if (!_.isEmpty(body)) {
        switch (body.mode) {
          case 'urlencoded':
            _.forEach(body.urlencoded, function (data) {
              if (!data.disabled) {
                snippet += indent + `${form('--data-urlencode', format)}`;
                snippet += ` "${sanitize(data.key, trim)}=${sanitize(data.value, trim)}"`;
              }
            });
            break;
          case 'raw':
            snippet += indent + `${form('--data-raw', format)} "${sanitize(body.raw.toString(), trim)}"`;
            break;
          case 'formdata':
            _.forEach(body.formdata, function (data) {
              if (!(data.disabled)) {
                if (data.type === 'file') {
                  snippet += indent + `${form('-F', format)}`;
                  snippet += ` "${sanitize(data.key, trim)}=@${sanitize(data.src, trim)}"`;
                }
                else {
                  snippet += indent + `${form('-F', format)}`;
                  snippet += ` "${sanitize(data.key, trim)}=${sanitize(data.value, trim)}"`;
                }
              }
            });
            break;
          case 'file':
            snippet += indent + `${form('--data-binary', format)}`;
            snippet += ` "@${sanitize(body[body.mode].src, trim)}"`;
            break;
          default:
            snippet += `${form('-d', format)} ""`;
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
        name: 'Line continuation character',
        id: 'lineContinuationCharacter',
        availableOptions: ['\\', '^'],
        type: 'enum',
        default: '\\',
        description: 'Set a character used to mark the continuation of a statement on the next line ' +
          '(generally, \\ for OSX/Linux, ^ for Windows)'
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
