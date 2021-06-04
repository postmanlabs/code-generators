var runNewmanTest = require('../../../../test/codegen/newman/newmanTestUtil').runNewmanTest,
  convert = require('../../lib/index').convert;

describe('convert for different request types', function () {
  let options = {indentCount: 3, indentType: 'Space', includeBoilerplate: true},
    testConfig = {
      compileScript: null,
      runScript: 'kotlinc -script main.kts -cp okhttp-4.9.0.jar:okio-2.10.0.jar',
      fileName: 'main.kts',
      skipCollections: ['redirectCollection']
    };
  runNewmanTest(convert, options, testConfig);
});
