var runNewmanTest = require('../../../../test/codegen/newman/newmanTestUtil').runNewmanTest,
  convert = require('../../lib/index').convert;

describe('Convert for different types of request', function () {
  var options = {indentCount: 2, indentType: 'Space'},
    testConfig = {
      compileScript: null,
      runScript: 'tsc run.ts && node run.js',
      fileName: 'run.ts',
      headerSnippet: '/* eslint-disable */\n'
    };

  runNewmanTest(convert, options, testConfig);

  describe('Convert for request incorporating ES6 features', function () {
    var options = {indentCount: 2, indentType: 'Space', ES6_enabled: true},
      testConfig = {
        compileScript: null,
        runScript: 'tsc run.ts && node run.js',
        fileName: 'run.ts',
        headerSnippet: '/* eslint-disable */\n'
      };

    runNewmanTest(convert, options, testConfig);
  });

});
