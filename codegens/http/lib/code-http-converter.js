let utils = require('./util');

/**
 * Used in order to get additional options for generation of C# code snippet (i.e. Include Boilerplate code)
 *
 * @module getOptions
 *
 * @returns {Array} Additional options specific to generation of http code snippet
 */
function getOptions () {
  return [{
    name: 'Body trim',
    id: 'trimRequestBody',
    type: 'boolean',
    default: true,
    description: 'Trim request body fields'
  }];
}

/**
 * Converts a Postman SDK request to HTTP message
 * 
 * @param {Object} request - Postman SDK request
 * @param {Object} options - Options for converter
 * @param {Boolean} options.trimRequestBody - determines whether to trim the body or not
 * @param {Function} callback callback
 * @returns {Function} returns the snippet with the callback function.
 */
function convert (request, options, callback) {
  let snippet = '';
  options = utils.sanitizeOptions(options, getOptions());
  snippet = `${request.method} ${utils.getEndPoint(request)} HTTP/1.1\n`;
  snippet += `Host: ${utils.getHost(request)}\n`;
  if (request.body && request.body.mode === 'file' && !request.headers.has('Content-Type')) {
    request.addHeader({
      key: 'Content-Type',
      value: 'text/plain'
    });
  }
  snippet += `${utils.getHeaders(request)}\n`;
  snippet += `\n${utils.getBody(request, options.trimRequestBody)}`;

  return callback(null, snippet);
}

module.exports = {
  getOptions: getOptions,
  convert: convert
};
