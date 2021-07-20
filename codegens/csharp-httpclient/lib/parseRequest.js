
var _ = require('./lodash'),
  sanitize = require('./util').sanitize;

function parseContentType (request) {
  return request.getHeaders({enabled: true, ignoreCase: true})['content-type'] || 'text/plain';
}

/**
 * Parses header in Postman-SDK request and returns code snippet of csharp-httpclient for adding headers
 *
 * @param {Object} requestJson - Postman SDK request object
 * @returns {String} code snippet for adding headers in csharp-httpclient
 */
function parseHeader (requestJson) {
  // Possibly add support for the typed header properties
  if (!Array.isArray(requestJson.header)) {
    return '';
  }

  return requestJson.header.reduce((headerSnippet, header) => {
    if (!header.disabled && sanitize(header.key) !== 'Content-Type') {
      headerSnippet += `request.Headers.Add("${sanitize(header.key, true)}", "${sanitize(header.value)}");\n`;
    }
    return headerSnippet;
  }, '');
}

function parseContentTypeOnContent (request) {
  return 'content.Headers.ContentType = new MediaTypeHeaderValue("' +
    `${sanitize(parseContentType(request))}");\n`;
}

function safeAddRealContentType (snippet, request) {
  if (!snippet) {
    return '';
  }

  var contentType = request.getHeaders({ ignoreCase: true, enabled: true })['content-type'];

  if (contentType &&
    snippet.includes('var content = ') &&
    !snippet.includes('content.Headers.ContentType = ')) {
    return snippet +
      'content.Headers.ContentType = new MediaTypeHeaderValue("' +
      `${sanitize(contentType)}");\n`;
  }

  return snippet;
}

function parseFormUrlEncoded (requestBody, contentName) {
  if (!Array.isArray(requestBody[requestBody.mode])) {
    return '';
  }

  if (!contentName) {
    contentName = 'content';
  }

  let list = requestBody[requestBody.mode].reduce((collection, data) => {
    if (data.disabled || data.type === 'file') {
      return collection;
    }

    (!data.value) && (data.value = '');
    collection += 'collection.Add(new KeyValuePair<string, string>' +
      `("${sanitize(data.key)}", "${sanitize(data.value)}"));\n`;

    return collection;
  }, '');

  if (list) {
    return 'var collection = new List<KeyValuePair<string, string>>();\n' +
    list +
    `var ${contentName} = new FormUrlEncodedContent(collection);\n`;
  }
  return '';
}


function parseFormData2 (requestBody) {
  if (!Array.isArray(requestBody[requestBody.mode])) {
    return '';
  }

  // Determine mode
  var hasFile = requestBody[requestBody.mode].some((i) => {
      return i.type === 'file';
    }),
    hasText = requestBody[requestBody.mode].some((i) => {
      return i.type === 'text';
    }),
    formContent = '';

  if (hasFile && hasText) {
    // Mixed mode, I will find both form and file items in here
    formContent = parseFormUrlEncoded(requestBody, 'formContent');

    return 'var content = new MultipartFormDataContent();\n' +
      formContent +
      'content.Add(formContent);\n';
  }
  else if (hasFile) {
    // This is file only mode
    return 'var content = new MultipartFormDataContent();\n' +
      requestBody[requestBody.mode].reduce((body, data) => {
        if (Array.isArray(data.src)) {
          // Many files
          body += data.src.reduce((filesBody, fileSrc) => {
            filesBody += 'content.Add(new StreamContent(new MemoryStream(' +
              `File.ReadAllBytes("${sanitize(fileSrc)}"))), "${sanitize(data.key)}", ` +
              `Path.GetFileName("${sanitize(fileSrc)}"));\n`;
            return filesBody;
          }, '');
        }
        else {
          // Single files
          body += 'content.Add(new StreamContent(new MemoryStream(' +
            `File.ReadAllBytes("${sanitize(data.src)}"))), "${sanitize(data.key)}", ` +
            `Path.GetFileName("${sanitize(data.src)}"));\n`;
        }
        return body;
      }, '');
  }
  // This is a form only
  formContent = parseFormUrlEncoded(requestBody);

  if (formContent && formContent.includes('var content = ')) {
    return formContent +
      'content.Headers.ContentType = new MediaTypeHeaderValue("");\n';
  }
}

function parseGraphQL (requestBody) {
  let query = requestBody.graphql.query,
    graphqlVariables;
  try {
    graphqlVariables = JSON.parse(requestBody.graphql.variables);
  }
  catch (e) {
    graphqlVariables = {};
  }
  return 'var content = new StringContent(' +
    `"${sanitize(JSON.stringify({query: query, variables: graphqlVariables}))}"` +
    ', null, "application/json");\n';
}

function parseBody (request) {
  var requestBody = request.body ? request.body.toJSON() : {};
  if (!_.isEmpty(requestBody)) {
    switch (requestBody.mode) {
      case 'urlencoded':
        return safeAddRealContentType(parseFormUrlEncoded(requestBody), request);
      case 'formdata':
        return safeAddRealContentType(parseFormData2(requestBody), request);
      case 'raw':
        return `var content = new StringContent(${JSON.stringify(requestBody[requestBody.mode])});\n` +
          parseContentTypeOnContent(request);
      case 'graphql':
        return parseGraphQL(requestBody);
      case 'file':
        return 'var content = new StreamContent(File.Create("<file path>"));\n';
      default:
        return '';
    }
  }
  return '';
}

module.exports = {
  parseHeader: parseHeader,
  parseBody: parseBody,
  parseContentType: parseContentType
};
