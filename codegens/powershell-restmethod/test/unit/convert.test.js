var expect = require('chai').expect,
  sdk = require('postman-collection'),
  exec = require('shelljs').exec,
  newman = require('newman'),
  parallel = require('async').parallel,
  fs = require('fs'),
  convert = require('../../lib/index').convert,
  sanitize = require('../../lib/util').sanitize,
  getOptions = require('../../lib/index').getOptions,
  mainCollection = require('./fixtures/testcollection/collection.json');

/**
 * runs codesnippet then compare it with newman output
 *
 * @param {String} codeSnippet - code snippet that needed to run using node
 * @param {Object} collection - collection which will be run using newman
 * @param {Function} done - callback for async calls
 */
function runSnippet (codeSnippet, collection, done) {
  fs.writeFileSync('snippet.ps1', codeSnippet);
  var run = 'node run.js';
  //  step by step process for compile, run code snippet, then comparing its output with newman
  parallel([
    function (callback) {
      return exec(run, function (err, stdout, stderr) {
        if (err) {
          return callback(err);
        }
        if (stderr) {
          return callback(stderr);
        }
        try {
          stdout = JSON.parse(stdout);
        }
        catch (e) {
          console.error(e);
        }
        return callback(null, stdout);
      });
    },
    function (callback) {
      newman.run({
        collection: collection
      }).on('request', function (err, summary) {
        if (err) {
          return callback(err);
        }

        var stdout = summary.response.stream.toString();
        try {

          stdout = JSON.parse(stdout);
        }
        catch (e) {
          console.error(e);
        }
        return callback(null, stdout);
      });
    }
  ], function (err, result) {
    if (err) {
      expect.fail(null, null, err);
    }
    else if (typeof result[1] !== 'object' || typeof result[0] !== 'object') {
      expect(result[0].trim()).to.include(result[1].trim());
    }
    else {
      const propertiesTodelete = ['cookies', 'headersSize', 'startedDateTime', 'clientIPAddress'],
        headersTodelete = [
          'accept-encoding',
          'user-agent',
          'cf-ray',
          'x-request-id',
          'x-request-start',
          'connect-time',
          'x-forwarded-for',
          'content-type',
          'content-length',
          'accept',
          'total-route-time',
          'cookie',
          'kong-cloud-request-id',
          'x-real-ip',
          'cache-control',
          'postman-token'
        ];
      if (result[0]) {
        propertiesTodelete.forEach(function (property) {
          delete result[0][property];
        });
        if (result[0].headers) {
          headersTodelete.forEach(function (property) {
            delete result[0].headers[property];
          });
        }
      }
      if (result[1]) {
        propertiesTodelete.forEach(function (property) {
          delete result[1][property];
        });
        if (result[1].headers) {
          headersTodelete.forEach(function (property) {
            delete result[1].headers[property];
          });
        }
      }

      expect(result[0]).deep.equal(result[1]);
    }
    return done();
  });
}

describe('Powershell-restmethod converter', function () {
  describe('convert for different request types', function () {
    mainCollection.item.forEach(function (item) {
      // Skipping tests for Travis CI, till powershell dependency issue is sorted on travis
      it.skip(item.name, function (done) {
        var request = new sdk.Request(item.request),
          collection = {
            item: [
              {
                request: request.toJSON()
              }
            ]
          },
          options = {
            requestTimeout: 10000,
            multiLine: true,
            followRedirect: true,
            longFormat: true
          };
        convert(request, options, function (error, snippet) {
          if (error) {
            expect.fail(null, null, error);
            return;
          }
          runSnippet(snippet, collection, done);
        });
      });
    });
  });
  // Temporary test, remove once newman tests run on CI.
  describe('POST Raw text, snippet test', function () {
    it('should return valid snippet', function () {
      var request = {
          'method': 'POST',
          'header': [
            {
              'key': 'Content-Type',
              'value': 'text/plain'
            }
          ],
          'body': {
            'mode': 'raw',
            'raw': 'Hello world'
          },
          'url': {
            'raw': 'https://mockbin.org/request',
            'protocol': 'https',
            'host': [
              'mockbin',
              'org'
            ],
            'path': [
              'request'
            ]
          },
          'description': 'Description'
        },
        pmRequest = new sdk.Request(request),
        options = {
          requestTimeout: 10000,
          multiLine: true,
          followRedirect: true,
          longFormat: true
        };
      convert(pmRequest, options, function (error, snippet) {
        if (error) {
          expect.fail(null, null, error);
          return;
        }
        const lines = snippet.split('\n');
        expect(lines[0]).to
          .eql('$headers = New-Object "System.Collections.Generic.Dictionary[[String],[String]]"');
        expect(lines[1]).to.eql('$headers.Add("Content-Type", "text/plain")');
        expect(lines[4]).to.eql('$body = @"');
        expect(lines[5]).to.eql('Hello world');
        expect(lines[6]).to.eql('"@');
        expect(lines[8]).to.eql('$response = Invoke-RestMethod \'https://mockbin.org/request\' -Method \'POST\' -Headers $headers -Body $body -TimeoutSec 10'); // eslint-disable-line max-len
        expect(lines[9]).to.eql('$response | ConvertTo-Json');
      });
    });
  });

  describe('Convert function ', function () {
    var request,
      options;
    it('should add a TimeoutSec argument when timeout is set to non zero value', function () {
      request = new sdk.Request(mainCollection.item[0].request);
      options = {
        requestTimeout: 1000
      };
      convert(request, options, function (error, snippet) {
        if (error) {
          expect.fail(null, null, error);
          return;
        }
        expect(snippet).to.be.a('string');
        expect(snippet).to.include('-TimeoutSec 1');
      });
    });

    it('should not add a TimeoutSec argument when timeout is set to 0', function () {
      request = new sdk.Request(mainCollection.item[0].request);
      options = {
        requestTimeout: 0
      };
      convert(request, options, function (error, snippet) {
        if (error) {
          expect.fail(null, null, error);
          return;
        }
        expect(snippet).to.be.a('string');
        expect(snippet).to.not.include('-TimeoutSec');
      });
    });

    it('should add a MaximumRedirection set to 0 argument when followRedirect is not allowed', function () {
      request = new sdk.Request(mainCollection.item[0].request);
      options = {
        followRedirect: false
      };
      convert(request, options, function (error, snippet) {
        if (error) {
          expect.fail(null, null, error);
          return;
        }
        expect(snippet).to.be.a('string');
        expect(snippet).to.include('-MaximumRedirection 0');
      });
    });

    it('should not add a MaximumRedirection argument when followRedirect is allowed', function () {
      request = new sdk.Request(mainCollection.item[0].request);
      options = {
        followRedirect: true
      };
      convert(request, options, function (error, snippet) {
        if (error) {
          expect.fail(null, null, error);
          return;
        }
        expect(snippet).to.be.a('string');
        expect(snippet).to.not.include('-MaximumRedirection');
      });
    });

    it('should default to mode raw when body mode is some random value', function () {
      request = new sdk.Request(mainCollection.item[2].request);
      request.body.mode = 'random';
      request.body[request.body.mode] = {};
      options = {};
      convert(request, options, function (error, snippet) {
        if (error) {
          expect.fail(null, null, error);
          return;
        }
        expect(snippet).to.be.a('string');
      });
    });

    it('should generate snippet for file body mode', function () {
      request = new sdk.Request({
        'url': 'https://echo.getpostman.com/post',
        'method': 'POST',
        'body': {
          'mode': 'file',
          'file': [
            {
              'key': 'fileName',
              'src': 'file',
              'type': 'file'
            }
          ]
        }
      });
      options = { indentType: 'Space', indentCount: 2 };
      convert(request, options, function (error, snippet) {
        if (error) {
          expect.fail(null, null, error);
        }
        expect(snippet).to.be.a('string');
        expect(snippet).to.not.equal('');
      });
    });

    it('should trim header keys and not trim header values', function () {
      var request = new sdk.Request({
        'method': 'GET',
        'header': [
          {
            'key': '   key_containing_whitespaces  ',
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
      convert(request, {}, function (error, snippet) {
        if (error) {
          expect.fail(null, null, error);
        }
        expect(snippet).to.be.a('string');
        expect(snippet).to.include('$headers.Add("key_containing_whitespaces", "  value_containing_whitespaces  ")');
      });
    });

    it('should include graphql body in the snippet', function () {
      var request = new sdk.Request({
        'method': 'POST',
        'header': [],
        'body': {
          'mode': 'graphql',
          'graphql': {
            'query': '{ body { graphql } }',
            'variables': '{"variable_key": "variable_value"}'
          }
        },
        'url': {
          'raw': 'http://postman-echo.com/post',
          'protocol': 'http',
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
        expect(snippet).to.include('@"\n{"query":"{ body { graphql } }"');
        expect(snippet).to.include('"variables":{"variable_key":"variable_value"}}\n"@');
      });
    });

    it('should generate snippets(not error out) for requests with multiple/no file in formdata', function () {
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
              'key': 'single file',
              'value': '',
              'type': 'file',
              'src': '/test1.txt'
            },
            {
              'key': 'multiple files',
              'value': '',
              'type': 'file',
              'src': ['/test2.txt',
                '/test3.txt']
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
        expect(snippet).to.include('$fileHeader.Name = "no file"');
        expect(snippet).to.include('$fileHeader.Name = "single file"');
        expect(snippet).to.include('$fileHeader.Name = "multiple files"');
        expect(snippet).to.include('$fileHeader.Name = "no src"');
        expect(snippet).to.include('$fileHeader.Name = "invalid src"');
        expect(snippet).to.include('$multipartFile = \'/path/to/file\'');
        expect(snippet).to.include('$multipartFile = \'/test1.txt\'');
        expect(snippet).to.include('$multipartFile = \'/test2.txt\'');
        expect(snippet).to.include('$multipartFile = \'/test3.txt\'');
      });
    });

    it('should generate valid snippet for single/double quotes in url', function () {
      var request = new sdk.Request({
        'method': 'GET',
        'header': [],
        'url': {
          'raw': 'https://postman-echo.com/get?query1=b\'b&query2=c"c',
          'protocol': 'https',
          'host': [
            'postman-echo',
            'com'
          ],
          'path': [
            'get'
          ],
          'query': [
            {
              'key': 'query1',
              'value': "b'b" // eslint-disable-line quotes
            },
            {
              'key': 'query2',
              'value': 'c"c'
            }
          ]
        }
      });
      convert(request, {}, function (error, snippet) {
        if (error) {
          expect.fail(null, null, error);
        }
        expect(snippet).to.be.a('string');
        // An extra single quote is placed before a single quote to escape a single quote inside a single quoted string
        // eslint-disable-next-line quotes
        expect(snippet).to.include("'https://postman-echo.com/get?query1=b''b&query2=c\"c'");
      });
    });

    it('should generate snippet for form data params with no type key present', function () {
      var request = new sdk.Request({
        method: 'POST',
        header: [],
        url: {
          raw: 'https://postman-echo.com/post',
          protocol: 'https',
          host: [
            'postman-echo',
            'com'
          ],
          path: [
            'post'
          ]
        },
        body: {
          mode: 'formdata',
          formdata: [
            {
              key: 'sample_key',
              value: 'sample_value'
            }
          ]
        }
      });
      convert(request, {}, function (error, snippet) {
        expect(error).to.be.null;
        expect(snippet).to.be.a('string');
        expect(snippet).to.include('$stringHeader = [System.Net.Http.Headers.ContentDispositionHeaderValue]' +
        '::new("form-data")');
        expect(snippet).to.include('$stringHeader.Name = "sample_key"');
        expect(snippet).to.include('$StringContent = [System.Net.Http.StringContent]::new("sample_value")');
      });
    });
  });

  describe('getOptions function', function () {

    it('should return an array of specific options', function () {
      expect(getOptions()).to.be.an('array');
    });

    it('should return all the valid options', function () {
      expect(getOptions()[0]).to.have.property('id', 'requestTimeout');
      expect(getOptions()[1]).to.have.property('id', 'followRedirect');
      expect(getOptions()[2]).to.have.property('id', 'trimRequestBody');
      expect(getOptions()[3]).to.have.property('id', 'replaceCharacters');
    });
  });

  describe('Sanitize function', function () {

    it('should return empty string when input is not a string type', function () {
      expect(sanitize(123, false)).to.equal('');
      expect(sanitize(null, false)).to.equal('');
      expect(sanitize({}, false)).to.equal('');
      expect(sanitize([], false)).to.equal('');
    });

    it('should trim input string when needed', function () {
      expect(sanitize('inputString     ', true)).to.equal('inputString');
    });
  });
});


