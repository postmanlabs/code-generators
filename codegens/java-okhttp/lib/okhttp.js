var _ = require('./lodash'),

  parseRequest = require('./parseRequest'),
  sanitize = require('./util').sanitize;

//  Since Java OkHttp requires to add extralines of code to handle methods with body
const METHODS_WITHOUT_BODY = ['GET', 'HEAD', 'COPY', 'UNLOCK', 'UNLINK', 'PURGE', 'LINK', 'VIEW'];

/**
 * retuns snippet of java okhttp by parsing data from Postman-SDK request object
 * 
 * @param {Object} request - Postman SDK request object
 * @param {String} indentString - indentation required for code snippet
 * @param {Object} options - Options to tweak code snippet
 * @returns {String} - java okhttp code snippet for given request object 
 */
function makeSnippet (request, indentString, options) {

  var isBodyRequired = !(_.includes(METHODS_WITHOUT_BODY, request.method)),
    snippet = 'OkHttpClient client = new OkHttpClient().newBuilder()\n',
    requestBody = (request.body ? request.body.toJSON() : {});

  if (options.requestTimeout > 0) {
    snippet += indentString + `.setConnectTimeout(${options.requestTimeout}, TimeUnit.MILLISECONDS)\n`;
  }

  if (!options.followRedirect) {
    snippet += indentString + '.followRedirects(false)\n';
  }

  snippet += indentString + '.build();\n';

  if (isBodyRequired) {
    //  snippet for creating mediatype object in java based on content-type of request
    snippet += `MediaType mediaType = MediaType.parse("${parseRequest.parseContentType(request)}");\n`;
    snippet += parseRequest.parseBody(requestBody, indentString, options.trimRequestBody);
  }

  snippet += 'Request request = new Request.Builder()\n';
  snippet += indentString + `.url("${sanitize(request.url.toString())}")\n`;
  snippet += indentString + `.method("${request.method}", ${isBodyRequired ? 'body' : 'null'})\n`;

  //  java-okhttp snippet for adding headers to request
  snippet += parseRequest.parseHeader(request, indentString);

  snippet += indentString + '.build();\n';
  snippet += 'Response response = client.newCall(request).execute();';

  return snippet;
}

/**
 * Converts Postman sdk request object to java okhttp code snippet
 *
 * @module convert
 *
 * @param {Object} request - postman-SDK request object 
 * @param {Object} options - Options to tweak code snippet generated in Java-OkHttp
 * @param {String} options.indentType - type for indentation eg: space, tab
 * @param {String} options.indentCount - number of spaces or tabs for indentation.
 * @param {Boolean} [options.includeBoilerplate] - indicates whether to include class defination in java
 * @param {Boolean} options.followRedirect - whether to enable followredirect
 * @param {Boolean} options.trimRequestBody - whether to trim fields in request body or not
 * @param {Number} options.requestTimeout : time in milli-seconds after which request will bail out
 * @param {Function} callback - callback function with parameters (error, snippet)
 */
module.exports = function (request, options, callback) {

  if (_.isFunction(options)) {
    callback = options;
    options = {};
  }
  else if (!_.isFunction(callback)) {
    throw new Error('Java-OkHttp-Converter: callback is not valid function');
  }

  //  String representing value of indentation required
  var indentString,

    //  snippets to include java class definition according to options
    headerSnippet = '',
    footerSnippet = '',

    //  snippet to create request in java okhttp
    snippet = '';

  indentString = options.indentType === 'tab' ? '\t' : ' ';
  indentString = indentString.repeat(options.indentCount || (options.indentType === 'tab' ? 1 : 4));

  if (options.includeBoilerplate) {
    headerSnippet = 'import java.io.*;\n' +
                        'import okhttp3.*;\n' +
                        'public class main {\n' +
                        indentString + 'public static void main(String []args) throws IOException{\n';
    footerSnippet = indentString.repeat(2) + 'System.out.println(response.body().string());\n' +
                        indentString + '}\n}\n';
  }

  snippet = makeSnippet(request, indentString, options);

  //  if boilerplate is included then two more indentString needs to be added in snippet
  (options.includeBoilerplate) &&
    (snippet = indentString.repeat(2) + snippet.split('\n').join('\n' + indentString.repeat(2)) + '\n');

  return callback(null, headerSnippet + snippet + footerSnippet);
};
