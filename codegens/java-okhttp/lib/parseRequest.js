
var _ = require('./lodash'),
  sanitize = require('./util').sanitize,
  path = require('path');

/**
 * parses body of request and returns urlencoded string
 *
 * @param {Object} requestBody - json object respresenting body of request
 * @param {Boolean} trimFields - indicates whether to trim fields of body
 * @returns {String} - urlencoded string for request body
 */
function parseUrlencode (requestBody, trimFields) {
  //  reducing array of urlencoded form data to array of strings
  return _.reduce(requestBody[requestBody.mode], function (accumalator, data) {
    if (!data.disabled) {
      accumalator.push(`${sanitize(data.key, trimFields)}=${sanitize(data.value, trimFields)}`);
    }
    return accumalator;
  }, []).join('&');
}

/**
 * parses body of request and creates java okhttp code snippet for adding form data
 *
 * @param {Object} requestBody - JSON object representing body of request
 * @param {String} indentString - string for indentation
 * @param {Boolean} trimFields - indicates whether to trim fields of body
 * @returns {String} - code snippet of java okhttp for multipart formdata
 */
function parseFormData (requestBody, indentString, trimFields) {
  return _.reduce(requestBody[requestBody.mode], function (body, data) {
    if (data.disabled) {
      return body;
    }
    /* istanbul ignore next */
    if (data.type === 'file') {
      var pathArray = data.src.split(path.sep),
        fileName = pathArray[pathArray.length - 1];
      body += indentString + '.addFormDataPart' +
                    `("${sanitize(data.key, trimFields)}","${sanitize(fileName, trimFields)}",\n` +
                    indentString.repeat(2) + 'RequestBody.create(MediaType.parse("application/octet-stream"),\n' +
                    indentString.repeat(2) + `new File("${sanitize(data.src)}")))\n`;
    }
    else {
      !data.value && (data.value = '');
      body += indentString + '.addFormDataPart' +
                    `("${sanitize(data.key, trimFields)}", "${sanitize(data.value, trimFields)}")\n`;
    }

    return body;
  }, '') + indentString + '.build()';
}

/**
 * parses request object and returns java okhttp code snippet for adding request body
 *
 * @param {Object} requestBody - JSON object representing body of request
 * @param {String} indentString - string for indentation
 * @param {Boolean} trimFields - indicates whether to trim fields of body
 * @returns {String} - code snippet of java okhttp parsed from request object
 */
function parseBody (requestBody, indentString, trimFields) {
  if (!_.isEmpty(requestBody)) {
    switch (requestBody.mode) {
      case 'urlencoded':
        return 'RequestBody body = RequestBody.create(mediaType, ' +
                        `"${parseUrlencode(requestBody, trimFields)}");\n`;
      case 'raw':
        return 'RequestBody body = RequestBody.create(mediaType, ' +
                        `${JSON.stringify(requestBody[requestBody.mode])});\n`;
      case 'formdata':
        return 'RequestBody body = new MultipartBody.Builder().setType(MultipartBody.FORM)\n' +
                        `${parseFormData(requestBody, indentString, trimFields)};\n`;
        /* istanbul ignore next */
      case 'file':
        // return 'RequestBody body = new MultipartBody.Builder().setType(MultipartBody.FORM)\n' +
        //                 indentString + `.addFormDataPart("file", "${requestBody[requestBody.mode].src}",\n` +
        //                 indentString + 'RequestBody.create(MediaType.parse("application/octet-stream"),\n' +
        //                 indentString + `new File("${requestBody[requestBody.mode].src}"))).build();\n`;
        return 'RequestBody body = RequestBody.create(mediaType, "<file contents here>");\n';
      default:
        return 'RequestBody body = RequestBody.create(mediaType, "");\n';
    }
  }
  return 'RequestBody body = RequestBody.create(mediaType, "");\n';
}

/**
 * Parses header in Postman-SDK request and returns code snippet of java okhttp for adding headers
 *
 * @param {Object} request - Postman SDK reqeust object
 * @param {String} indentString - indentation for code snippet
 * @returns {String} - code snippet for adding headers in java-okhttp
 */
function parseHeader (request, indentString) {
  var headerObject = request.getHeaders({enabled: true}),
    headerSnippet = '';

  if (!_.isEmpty(headerObject)) {
    headerSnippet += _.reduce(Object.keys(headerObject), function (accumalator, key) {
      accumalator += indentString + `.addHeader("${sanitize(key)}", ` +
                           `"${sanitize(headerObject[key])}")\n`;
      return accumalator;
    }, '');
  }
  return headerSnippet;
}

/**
 * returns content-type of request body if available else returns text/plain as default
 *
 * @param {Object} request - Postman SDK request object
 * @returns {String}- content-type of request body
 */
function parseContentType (request) {
  return request.getHeaders({enabled: true, ignoreCase: true})['content-type'] || 'text/plain';
}

module.exports = {
  parseBody: parseBody,
  parseHeader: parseHeader,
  parseContentType: parseContentType
};
