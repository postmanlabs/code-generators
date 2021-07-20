var expect = require('chai').expect,
  sdk = require('postman-collection'),
  convert = require('../../lib/index').convert,
  mainCollection = require('./fixtures/testcollection/collection.json'),
  testCollection = require('./fixtures/testcollection/collectionForEdge.json'),
  // getOptions = require('../../lib/index').getOptions,
  testResponse = require('./fixtures/testresponse.json');
  // sanitize = require('../../lib/util').sanitize,
  // csharpify = require('../../lib/util').csharpify;

describe('csharp httpclient function', function () {

  describe('csharp-httpclient convert function', function () {
    it('should return expected snippet', function () {
      var request = new sdk.Request(mainCollection.item[10].request),
        options = {
          indentCount: 1,
          indentType: 'Tab'
        };

      convert(request, options, function (error, snippet) {
        if (error) {
          expect.fail(null, null, error);
          return;
        }
        expect(snippet).deep.equal(testResponse.result);
      });
    });
  });

  describe('convert function', function () {
    var request = new sdk.Request(testCollection.item[0].request),
      snippetArray,
      options = {
        includeBoilerplate: true,
        indentType: 'Space',
        indentCount: 2
      };

    it('should return snippet with boilerplate code given option', function () {
      convert(request, { includeBoilerplate: true}, function (error, snippet) {
        if (error) {
          expect.fail(null, null, error);
          return;
        }
        expect(snippet).to.include('using System.Net.Http;\n');
      });
    });

    it('should generate snippet with Space as indent type with exact indent count', function () {
      convert(request, options, function (error, snippet) {
        if (error) {
          expect.fail(null, null, error);
          return;
        }
        snippetArray = snippet.split('\n');
        for (var i = 0; i < snippetArray.length; i++) {
          if (snippetArray[i].startsWith('namespace HelloWorldApplication')) {
            expect(snippetArray[i + 1].charAt(0)).to.equal('{');
            // TODO: Do more expects
            expect(snippetArray[i + 2].charAt(0)).to.equal(' ');
          }
        }
      });
    });
  });
});
