var runNewmanTest = require('../../../../test/codegen/newman/newmanTestUtil').runNewmanTest,
  convert = require('../../index').convert;


describe('Powershell Restmethod Converter', function () {
  // Skipping newman tests for now
  // TODO: Addition of set_include_path() in generated snippet
  describe('convert for different request types', function () {
    var options = {
        indentType: 'Space',
        indentCount: 4
      },
      testConfig = {
        runScript: 'pwsh codesnippet.ps',
        fileName: 'codesnippet.ps',
        skipCollections: ['sameNameHeadersCollection']
      };
    runNewmanTest(convert, options, testConfig);
  });
});
