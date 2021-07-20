var _ = require('./lodash'),
  parseRequest = require('./parseRequest'),
  sanitize = require('./util').sanitize,
  csharpify = require('./util').csharpify,
  sanitizeOptions = require('./util').sanitizeOptions,
  self;

/**
 *
 * @param {Object} request - Postman SDK request object
 * @returns {String} csharp-httpclient code snippet for given request object
 */
function makeSnippet (request) {
  const IS_PROPERTY_METHOD = [ 'DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT', 'TRACE' ];

  var snippet = 'var client = new HttpClient();\n';

  // Add in request timeout e.g client.Timeout = TimeSpan.FromSeconds();

  // Create the request
  snippet += 'var request = new HttpRequestMessage(';

  if (IS_PROPERTY_METHOD.includes(request.method)) {
    snippet += `HttpMethod.${csharpify(request.method)}`;
  }
  else {
    snippet += `new HttpMethod("${request.method}")`;
  }

  snippet += `, "${sanitize(request.url.toString())}");\n`;
  // Finish the initial creation of the request

  // Parse headers
  snippet += parseRequest.parseHeader(request.toJSON());

  // Configure the body
  let bodyContent = parseRequest.parseBody(request);
  if (bodyContent) {
    snippet += bodyContent;
    // Add in content type header
    snippet += 'request.Content = content;\n';
  }

  snippet += 'var response = await client.SendAsync(request);\n';
  snippet += 'response.EnsureSuccessStatusCode();\n';
  snippet += 'Console.WriteLine(await response.Content.ReadAsStringAsync());\n';

  return snippet;
}

self = module.exports = {

  /**
   * Used in order to get additional options for generation of C# code snippet (i.e. Include Boilerplate code)
   *
   * @module getOptions
   *
   * @returns {Array} Additional options specific to generation of csharp-httpclient code snippet
   */
  getOptions: function () {
    return [
      {
        name: 'Include boilerplate',
        id: 'includeBoilerplate',
        type: 'boolean',
        default: false,
        description: 'Include class definition and import statements in snippet'
      },
      {
        name: 'Set indentation count',
        id: 'indentCount',
        type: 'positiveInteger',
        default: 2,
        description: 'Set the number of indentation characters to add per code level'
      },
      {
        name: 'Set indentation type',
        id: 'indentType',
        type: 'enum',
        availableOptions: ['Tab', 'Space'],
        default: 'Space',
        description: 'Select the character used to indent lines of code'
      }
    ];
  },

  /**
   * Converts Postman sdk request object to csharp-httpclient code snippet
   *
   * @module convert
   *
   * @param {Object} request - Postman-SDK request object
   * @param {Object} options - Options to tweak code snippet generated in C#
   * @param {String} options.indentType - type for indentation eg: Space, Tab (default: Space)
   * @param {String} options.indentCount - number of spaces or tabs for indentation. (default: 4 for indentType:
   *                                      Space, default: 1 for indentType: Tab)
   * @param {Boolean} [options.includeBoilerplate] - indicates whether to include class definition in C#
   * @param {Function} callback - Callback function with parameters (error, snippet)
   *
   * @returns {String} Generated C# snippet via callback
   */
  convert: function (request, options, callback) {
    if (!_.isFunction(callback)) {
      throw new Error('C#-HttpClient-Converter: Callback is not valid function');
    }

    // String representing value of indentation required
    var indentString,

      // snippets to include C# class definition according to options
      headerSnippet = '',
      footerSnippet = '',

      // snippet to create request in csharp-httpclient
      snippet = '';

    // TODO: Sanitize options here
    options = sanitizeOptions(options, self.getOptions());

    // TODO: Get this stuff from options
    indentString = options.indentType === 'Tab' ? '\t' : ' ';
    indentString = indentString.repeat(options.indentCount);

    if (options.includeBoilerplate) {
      headerSnippet = 'using System;\n' +
        'using System.Collections.Generic;\n' +
        'using System.IO;\n' +
        'using System.Net.Http;\n' +
        'using System.Net.Http.Headers;\n' +
        'using System.Threading.Tasks;\n' +
        'namespace HelloWorldApplication\n' +
        '{\n' +
        indentString + 'class HelloWorld\n' +
        indentString + '{\n' +
        indentString.repeat(2) + 'static async Task Main(string[] args)\n' +
        indentString.repeat(2) + '{\n';

      footerSnippet = indentString.repeat(2) + '}\n' +
        indentString + '}\n' +
        '}\n';
    }
    snippet = makeSnippet(request);

    return callback(null, headerSnippet + snippet + footerSnippet);
  }
};
