var expect = require('chai').expect,
  sdk = require('postman-collection'),
  convert = require('../../index').convert,
  getUrlStringfromUrlObject = require('../../lib/util').getUrlStringfromUrlObject;

describe('curl convert function', function () {
  describe('Convert function', function () {
    var request, options, snippetArray, line;

    it('should return snippet with carat(^) as line continuation ' +
            'character for multiline code generation', function () {
      request = new sdk.Request({
        'method': 'POST',
        'header': [],
        'body': {
          'mode': 'raw',
          'raw': ''
        }
      });
      options = {
        multiLine: true,
        lineContinuationCharacter: '^'
      };
      convert(request, options, function (error, snippet) {
        if (error) {
          expect.fail(null, null, error);
        }
        snippetArray = snippet.split('\n');
        // Ignoring the last line as there is no line continuation character at last line
        for (var i = 0; i < snippetArray.length - 1; i++) {
          line = snippetArray[i];
          expect(line.charAt(line.length - 1)).to.equal('^');
        }
      });
    });

    it('should return snippet with url in single quote(\')', function () {
      request = new sdk.Request({
        'method': 'POST',
        'header': [],
        'body': {
          'mode': 'raw',
          'raw': ''
        }
      });
      options = {
        quoteType: 'single'
      };
      convert(request, options, function (error, snippet) {
        if (error) {
          expect.fail(null, null, error);
        }

        snippetArray = snippet.split(' ');
        expect(snippetArray[4][0]).to.equal('\'');
      });
    });

    it('should return snippet with url in double quote(")', function () {
      request = new sdk.Request({
        'method': 'POST',
        'header': [],
        'body': {
          'mode': 'raw',
          'raw': ''
        }
      });
      options = {
        quoteType: 'double'
      };
      convert(request, options, function (error, snippet) {
        if (error) {
          expect.fail(null, null, error);
        }

        snippetArray = snippet.split(' ');
        expect(snippetArray[4][0]).to.equal('"');
      });
    });

    it('should add semicolon after header key, if the value is empty string', function () {
      request = new sdk.Request({
        'method': 'GET',
        'header': [
          {
            'key': 'hello',
            'value': ''
          }
        ],
        'url': {
          'raw': 'https://postman-echo.com/get',
          'protocol': 'https',
          'host': [
            'postman-echo',
            'com'
          ],
          'path': [
            'get'
          ]
        }
      });
      convert(request, {}, function (error, snippet) {
        if (error) {
          expect.fail(null, null, error);
        }
        expect(snippet).to.be.a('string');
        expect(snippet).to.contain('--header \'hello;\'');
      });
    });

    it('should return snippet with backslash(\\) as line continuation ' +
            'character for multiline code generation by default', function () {
      request = new sdk.Request({
        'method': 'POST',
        'header': [],
        'body': {
          'mode': 'raw',
          'raw': ''
        }
      });
      options = {
        multiLine: true
      };
      convert(request, options, function (error, snippet) {
        if (error) {
          expect.fail(null, null, error);
        }
        snippetArray = snippet.split('\n');
        // Ignoring the last line as there is no line continuation character at last line
        for (var i = 0; i < snippetArray.length - 1; i++) {
          line = snippetArray[i];
          expect(line.charAt(line.length - 1)).to.equal('\\');
        }
      });
    });

    it('should return snippet with backtick(`) as line continuation ' +
            'character for multiline code generation', function () {
      request = new sdk.Request({
        'method': 'POST',
        'header': [],
        'body': {
          'mode': 'raw',
          'raw': ''
        }
      });
      options = {
        multiLine: true,
        lineContinuationCharacter: '`'
      };
      convert(request, options, function (error, snippet) {
        if (error) {
          expect.fail(null, null, error);
        }
        snippetArray = snippet.split('\n');
        // Ignoring the last line as there is no line continuation character at last line
        for (var i = 0; i < snippetArray.length - 1; i++) {
          line = snippetArray[i];
          expect(line.charAt(line.length - 1)).to.equal('`');
        }
      });
    });

    it('should add content type if formdata field contains a content-type', function () {
      request = new sdk.Request({
        'method': 'POST',
        'body': {
          'mode': 'formdata',
          'formdata': [
            {
              'key': 'json',
              'value': '{"hello": "world"}',
              'contentType': 'application/json',
              'type': 'text'
            }
          ]
        },
        'url': {
          'raw': 'http://postman-echo.com/post',
          'host': [
            'postman-echo',
            'com'
          ],
          'path': [
            'post'
          ]
        }
      });

      convert(request, {}, function (error, snippet) {
        if (error) {
          expect.fail(null, null, error);
        }
        expect(snippet).to.be.a('string');
        expect(snippet).to.contain('--form \'json="{\\"hello\\": \\"world\\"}";type=application/json\'');

      });
    });

    it('should parse header with string value properly', function () {
      request = new sdk.Request({
        'method': 'POST',
        'header': [
          {
            'key': 'foo',
            'value': '"bar"'
          }
        ],
        'body': {
          'mode': 'raw',
          'raw': ''
        }
      });
      options = {
        longFormat: false
      };
      convert(request, options, function (error, snippet) {
        if (error) {
          expect.fail(null, null, error);
        }
        expect(snippet).to.include("-H 'foo: \"bar\"'"); // eslint-disable-line quotes
      });
    });

    it('should generate snippet with -g parameter when either of {,[,},] are present in url parameter', function () {
      [
        '{world}',
        '{{world',
        '[world]',
        ']world',
        'world}'
      ].forEach(function (value) {
        request = new sdk.Request({
          'method': 'GET',
          'url': {
            'raw': `http://example.com?hello=${value}`,
            'protocol': 'http',
            'host': [
              'example',
              'com'
            ],
            'query': [
              {
                'key': 'hello',
                'value': value
              }
            ]
          }
        });
        convert(request, {}, function (error, snippet) {
          if (error) {
            expect.fail(null, null, error);
          }
          expect(snippet).to.include('-g');
        });
      });
    });

    it('should return snippet without errors when request object has no body property', function () {
      request = new sdk.Request({
        'method': 'GET',
        'header': [],
        'url': {
          'raw': 'https://google.com',
          'protocol': 'https',
          'host': [
            'google',
            'com'
          ]
        }
      });
      options = {
        longFormat: false
      };
      convert(request, options, function (error, snippet) {
        if (error) {
          expect.fail(null, null, error);
        }
        expect(snippet).to.be.a('string');
        expect(snippet).to.include("GET 'https://google.com'"); // eslint-disable-line quotes
      });
    });

    it('should return snippet with backslash(\\) character as line continuation ' +
         'character for multiline code generation', function () {
      request = new sdk.Request({
        'method': 'POST',
        'header': [],
        'body': {
          'mode': 'raw',
          'raw': ''
        }
      });
      options = {
        multiLine: true,
        lineContinuationCharacter: '\\'
      };
      convert(request, options, function (error, snippet) {
        if (error) {
          expect.fail(null, null, error);
        }
        snippetArray = snippet.split('\n');
        // Ignoring the last line as there is no line continuation character at last line
        for (var i = 0; i < snippetArray.length - 1; i++) {
          line = snippetArray[i];
          expect(line.charAt(line.length - 1)).to.equal('\\');
        }
      });
    });

    it('should not encode queryParam unresolved variables and ' +
    'leave it inside double parenthesis {{xyz}}', function () {
      request = new sdk.Request({
        'method': 'POST',
        'header': [],
        'url': {
          'raw': 'http://postman-echo.com/post?a={{xyz}}',
          'protocol': 'http',
          'host': [
            'postman-echo',
            'com'
          ],
          'path': [
            'post'
          ],
          'query': [
            {
              'key': 'a',
              'value': '{{xyz}}'
            }
          ]
        }
      });
      options = {};
      convert(request, options, function (error, snippet) {
        if (error) {
          expect.fail(null, null, error);
        }
        expect(snippet).to.be.a('string');
        expect(snippet).to.include('http://postman-echo.com/post?a={{xyz}}');
        expect(snippet).to.not.include('http://postman-echo.com/post?a=%7B%7Bxyz%7D%7D');
      });
    });

    it('should encode queryParams other than unresolved variables', function () {
      request = new sdk.Request({
        'method': 'POST',
        'header': [],
        'url': {
          'raw': 'http://postman-echo.com/post?a=b c',
          'protocol': 'http',
          'host': [
            'postman-echo',
            'com'
          ],
          'path': [
            'post'
          ],
          'query': [
            {
              'key': 'a',
              'value': 'b c'
            }
          ]
        }
      });
      options = {};
      convert(request, options, function (error, snippet) {
        if (error) {
          expect.fail(null, null, error);
        }
        expect(snippet).to.be.a('string');
        expect(snippet).to.include('http://postman-echo.com/post?a=b%20c');
        expect(snippet).to.not.include('http://postman-echo.com/post?a=b c');
      });
    });

    it('should trim header keys and not trim header values', function () {
      var request = new sdk.Request({
        'method': 'GET',
        'header': [
          {
            'key': '  key_containing_whitespaces  ',
            'value': '  value_containing_whitespaces  '
          }
        ],
        'url': {
          'raw': 'https://google.com',
          'protocol': 'https',
          'host': [
            'google',
            'com'
          ]
        }
      });
      convert(request, { longFormat: true }, function (error, snippet) {
        if (error) {
          expect.fail(null, null, error);
        }
        expect(snippet).to.be.a('string');
        // one extra space in matching the output because we add key:<space>value in the snippet
        expect(snippet).to.include(
          `--header 'key_containing_whitespaces:   value_containing_whitespaces  '`); // eslint-disable-line quotes
      });
    });

    it('should generate snippets for no files in form data', function () {
      var request = new sdk.Request({
        'method': 'POST',
        'header': [],
        'body': {
          'mode': 'formdata',
          'formdata': [
            {
              'key': 'no file',
              'value': '',
              'type': 'file',
              'src': []
            },
            {
              'key': 'no src',
              'value': '',
              'type': 'file'
            },
            {
              'key': 'invalid src',
              'value': '',
              'type': 'file',
              'src': {}
            }
          ]
        },
        'url': {
          'raw': 'https://postman-echo.com/post',
          'protocol': 'https',
          'host': [
            'postman-echo',
            'com'
          ],
          'path': [
            'post'
          ]
        }
      });
      convert(request, {}, function (error, snippet) {
        if (error) {
          expect.fail(null, null, error);
        }
        expect(snippet).to.be.a('string');
        expect(snippet).to.include('no file=@"/path/to/file"');
        expect(snippet).to.include('no src=@"/path/to/file"');
        expect(snippet).to.include('invalid src=@"/path/to/file"');
      });
    });

    it('should generate valid snippets for single/double quotes in URL', function () {
      // url = https://a"b'c.com/'d/"e
      var request = new sdk.Request("https://a\"b'c.com/'d/\"e"); // eslint-disable-line quotes
      convert(request, {}, function (error, snippet) {
        if (error) {
          expect.fail(null, null, error);
        }
        // for curl escaping of single quotes inside single quotes involves changing of ' to '\''
        // expect => 'https://a"b'\''c.com/'\''d/"e'
        expect(snippet).to.include("'https://a\"b'\\''c.com/'\\''d/\"e'"); // eslint-disable-line quotes
      });
    });

    it('should generate valid snippets when quoteType is "double"', function () {
      // url = https://a"b'c.com/'d/"e
      var request = new sdk.Request({
        'method': 'POST',
        'body': {
          'mode': 'formdata',
          'formdata': [
            {
              'key': 'json',
              'value': '{"hello": "world"}',
              'contentType': 'application/json',
              'type': 'text'
            }
          ]
        },
        'url': {
          'raw': "https://a\"b'c.com/'d/\"e", // eslint-disable-line quotes
          'host': [
            'a"b\'c',
            'com'
          ]
        }
      });
      convert(request, {quoteType: 'double'}, function (error, snippet) {
        if (error) {
          expect.fail(null, null, error);
        }

        expect(snippet).to.include('"a\\"b\'c.com"');
        expect(snippet).to.include('"json=\\"{\\\\\\"hello\\\\\\": \\\\\\"world\\\\\\"}\\";type=application/json"');
      });
    });

    it('should not add appropriate escaping characters when quote type is "double"', function () {
      var request = new sdk.Request({
        'method': 'POST',
        'header': [],
        'body': {
          'mode': 'graphql',
          'graphql': {
            'query': '{\n  findScenes(\n    filter: {per_page: 0}\n    scene_filter: {is_missing: "performers"}){\n    count\n    scenes {\n      id\n      title\n      path\n    }\n  }\n}', // eslint-disable-line
            'variables': '{\n\t"variable_key": "variable_value"\n}'
          }
        },
        'url': {
          'raw': 'https://postman-echo.com/post',
          'protocol': 'https',
          'host': [
            'postman-echo',
            'com'
          ],
          'path': [
            'post'
          ]
        }
      });
      convert(request, { quoteType: 'double', lineContinuationCharacter: '^' }, function (error, snippet) {
        if (error) {
          expect.fail(null, null, error);
        }

        expect(snippet).to.include('{\\"query\\":\\"{\\n  findScenes(\\n    filter: {per_page: 0}\\n    scene_filter: {is_missing: \\\\\\"performers\\\\\\"})'); // eslint-disable-line
      });
    });

    describe('getUrlStringfromUrlObject function', function () {
      var rawUrl, urlObject, outputUrlString;

      it('should return empty string for an url object for an empty url or if no url object is passed', function () {
        rawUrl = '';
        urlObject = new sdk.Url(rawUrl);
        outputUrlString = getUrlStringfromUrlObject(urlObject);
        expect(outputUrlString).to.be.empty;
        outputUrlString = getUrlStringfromUrlObject();
        expect(outputUrlString).to.be.empty;
      });

      it('should add protocol if present in the url object', function () {
        rawUrl = 'https://postman-echo.com';
        urlObject = new sdk.Url(rawUrl);
        outputUrlString = getUrlStringfromUrlObject(urlObject);
        expect(outputUrlString).to.equal(rawUrl);
      });

      it('should add the auth information if present in the url object', function () {
        rawUrl = 'https://user:password@postman-echo.com';
        urlObject = new sdk.Url(rawUrl);
        outputUrlString = getUrlStringfromUrlObject(urlObject);
        expect(outputUrlString).to.equal(rawUrl);
      });

      it('should not add the auth information if user isn\'t present but' +
      ' password is present in the url object', function () {
        rawUrl = 'https://:password@postman-echo.com';
        urlObject = new sdk.Url(rawUrl);
        outputUrlString = getUrlStringfromUrlObject(urlObject);
        expect(outputUrlString).to.not.include(':password');
      });

      it('should add host if present in the url object', function () {
        rawUrl = 'https://postman-echo.com';
        urlObject = new sdk.Url(rawUrl);
        outputUrlString = getUrlStringfromUrlObject(urlObject);
        expect(outputUrlString).to.equal(rawUrl);
      });

      it('should add port if present in the url object', function () {
        rawUrl = 'https://postman-echo.com:8080';
        urlObject = new sdk.Url(rawUrl);
        outputUrlString = getUrlStringfromUrlObject(urlObject);
        expect(outputUrlString).to.equal(rawUrl);
      });

      it('should add path if present in the url object', function () {
        rawUrl = 'https://postman-echo.com/get';
        urlObject = new sdk.Url(rawUrl);
        outputUrlString = getUrlStringfromUrlObject(urlObject);
        expect(outputUrlString).to.equal(rawUrl);
      });

      describe('queryParams', function () {

        it('should not encode unresolved query params', function () {
          rawUrl = 'https://postman-echo.com/get?key={{value}}';
          urlObject = new sdk.Url(rawUrl);
          outputUrlString = getUrlStringfromUrlObject(urlObject);
          expect(outputUrlString).to.not.include('key=%7B%7Bvalue%7B%7B');
          expect(outputUrlString).to.equal(rawUrl);
        });

        it('should encode query params other than unresolved variables', function () {
          rawUrl = 'https://postman-echo.com/get?key=\'a b c\'';
          urlObject = new sdk.Url(rawUrl);
          outputUrlString = getUrlStringfromUrlObject(urlObject);
          expect(outputUrlString).to.not.include('key=\'a b c\'');
          expect(outputUrlString).to.equal('https://postman-echo.com/get?key=%27a%20b%20c%27');
        });

        it('should not encode unresolved query params and ' +
        'encode every other query param, both present together', function () {
          rawUrl = 'https://postman-echo.com/get?key1={{value}}&key2=\'a b c\'';
          urlObject = new sdk.Url(rawUrl);
          outputUrlString = getUrlStringfromUrlObject(urlObject);
          expect(outputUrlString).to.not.include('key1=%7B%7Bvalue%7B%7B');
          expect(outputUrlString).to.not.include('key2=\'a b c\'');
          expect(outputUrlString).to.equal('https://postman-echo.com/get?key1={{value}}&key2=%27a%20b%20c%27');
        });

        it('should discard disabled query params', function () {
          urlObject = new sdk.Url({
            protocol: 'https',
            host: 'postman-echo.com',
            query: [
              { key: 'foo', value: 'bar' },
              { key: 'alpha', value: 'beta', disabled: true }
            ]
          });
          outputUrlString = getUrlStringfromUrlObject(urlObject);
          expect(outputUrlString).to.equal('https://postman-echo.com?foo=bar');
        });
      });

      it('should add hash if present in the url object', function () {
        rawUrl = 'https://postmanm-echo.com/get#hash';
        urlObject = new sdk.Url(rawUrl);
        outputUrlString = getUrlStringfromUrlObject(urlObject);
        expect(outputUrlString).to.equal(rawUrl);
      });
    });
  });
});
