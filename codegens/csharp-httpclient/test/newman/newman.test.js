var path = require('path'),
  runNewmanTest = require('../../../../test/codegen/newman/newmanTestUtil').runNewmanTest,
  convert = require('../../index').convert;


describe('convert for different request types', function () {
  var projectPath = path.resolve(__dirname, '../../testProject'),
    testConfig = {
      // filename along with the appropriate version of the file. This file will be used to run the snippet.
      fileName: projectPath + '/Program.cs',
      // Run script required to run the generated code snippet
      runScript: 'dotnet run --project ' + projectPath,
      // Compile script required to compile the code snippet
      compileScript: 'dotnet build ' + projectPath,
      // Array of name of collections for which newman tests has to be skipped.
      skipCollections: ['sameNameHeadersCollection']
    },
    options = {
      includeBoilerplate: true
    };
  runNewmanTest(convert, options, testConfig);
});
