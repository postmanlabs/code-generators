let testCollection = require('../resources/test-collection.json'),
  expectedResults = require('../resources/expected-http-messages.json'),
  { convert } = require('../../index'),
  { expect } = require('chai'),
  _ = require('lodash'),
  Request = require('postman-collection').Request,

  requests = testCollection.item;

describe('Converter test', function () {

  _.forEach(requests, function (r, ind) {
    let testRequest = new Request(r.request);
    convert(testRequest, {}, function (err, snippet) {
      if (err) {
        console.log('Something went wrong while converting the request');
      }
      it(`should generate appropriate http message for: ${r.name}`, function () {
        expect(snippet).to.equal(expectedResults.result[ind]);
      });
    });
  });
});

describe('Converter test using options.requestBodyTrim', function () {
  let requestModeRaw = requests[6], // request.body.mode: raw
    requestModeFormData = requests[4], // request.body.mode: formdata
    requestModeUrlEncoded = requests[7], // request.body.mode: urlencoded
    testRequestModeRaw = new Request(requestModeRaw.request),
    testRequestModeFormData = new Request(requestModeFormData.request),
    testRequestModeUrlEncoded = new Request(requestModeUrlEncoded.request);

  convert(testRequestModeRaw, { requestBodyTrim: true}, function (err, snippet) {
    if (err) {
      console.log('Something went wrong while converting the request');
    }

    it(`should generate appropriate http message using options.requestBodyTrim: true, for: ${requestModeRaw.name}`,
      function () {
        expect(snippet).to.equal(expectedResults.trimmedResult[0]);
      });
  });
  convert(testRequestModeFormData, { requestBodyTrim: true}, function (err, snippet) {
    if (err) {
      console.log('Something went wrong while converting the request');
    }

    it(`should generate appropriate http message using options.requestBodyTrim: true, for: ${requestModeFormData.name}`,
      function () {
        expect(snippet).to.equal(expectedResults.trimmedResult[1]);
      });
  });
  convert(testRequestModeUrlEncoded, { requestBodyTrim: true}, function (err, snippet) {
    if (err) {
      console.log('Something went wrong while converting the request');
    }

    it('should generate appropriate http message using options.requestBodyTrim: true, for:' +
      `${requestModeUrlEncoded.name}`,
    function () {
      expect(snippet).to.equal(expectedResults.trimmedResult[2]);
    });
  });
});
