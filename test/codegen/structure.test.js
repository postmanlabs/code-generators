var _ = require('lodash'),
  expect = require('chai').expect,
  parseIgnore = require('parse-gitignore'),
  path = require('path'),
  fs = require('fs'),
  args = process.argv.splice(2),
  codegen = args[1];
// Keep adding new options
const expectedOptions = {
    multiLine: {
      name: 'Generate multiline snippet',
      type: 'boolean',
      default: true,
      description: 'Split cURL command across multiple lines'
    },
    longFormat: {
      name: 'Use long form options',
      type: 'boolean',
      default: true,
      description: 'Use the long form for cURL options (--header instead of -H)'
    },
    includeBoilerplate: {
      name: 'Include boilerplate',
      type: 'boolean',
      default: false,
      description: 'Include class definition and import statements in snippet'
    },
    indentCount: {
      name: 'Set indentation count',
      type: 'positiveInteger',
      default: 0,
      description: 'Set the number of indentation characters to add per code level'
    },
    indentType: {
      name: 'Set indentation type',
      type: 'enum',
      default: 'Tab',
      description: 'Select the character used to indent lines of code'
    },
    requestTimeout: {
      name: 'Set request timeout',
      type: 'positiveInteger',
      default: 0,
      description: 'Set number of milliseconds the request should wait' +
      ' for a response before timing out (use 0 for infinity)'
    },
    requestTimeoutInSeconds: {
      name: 'Set request timeout (in seconds)',
      type: 'positiveInteger',
      default: 0,
      description: 'Set number of seconds the request should wait' +
      ' for a response before timing out (use 0 for infinity)'
    },
    followRedirect: {
      name: 'Follow redirects',
      type: 'boolean',
      default: true,
      description: 'Automatically follow HTTP redirects'
    },
    trimRequestBody: {
      name: 'Trim request body fields',
      type: 'boolean',
      default: true,
      description: 'Remove white space and additional lines that may affect the server\'s response'
    },
    silent: {
      name: 'Use Silent Mode',
      type: 'boolean',
      default: false,
      description: 'Display the requested data without showing the cURL progress meter or error messages'
    },
    ES6_enabled: {
      name: 'Enable ES6 features',
      type: 'boolean',
      default: false,
      description: 'Modifies code snippet to incorporate ES6 (EcmaScript) features'
    },
    quoteType: {
      name: 'Quote Type',
      type: 'enum',
      default: 'single',
      description: 'String denoting the quote type to use (single or double) for URL ' +
          '(Use double quotes when running curl in cmd.exe and single quotes for the rest)'
    }
  },
  // Standard array of ids that should be used for options ids. Any new option should be updated here.
  optionsIdFormat = [
    'multiLine',
    'longFormat',
    'indentType',
    'indentCount',
    'trimRequestBody',
    'requestTimeout',
    'requestTimeoutInSeconds',
    'silent',
    'includeBoilerplate',
    'followRedirect',
    'lineContinuationCharacter',
    'protocol',
    'useMimeType',
    'ES6_enabled',
    'quoteType'
  ],
  CODEGEN_ABS_PATH = `./codegens/${codegen}`;
describe('Code-gen repository ' + codegen, function () {
  var content,
    json;
  try {
    content = fs.readFileSync(`${CODEGEN_ABS_PATH}/package.json`).toString();
    json = JSON.parse(content);
  }
  catch (e) {
    console.error(e);
    content = '';
    json = {};
  }

  const mainEntryFileAddress = path.resolve(CODEGEN_ABS_PATH, json.main);

  describe('package.json', function () {
    it('must have readable JSON content', function () {
      expect(content).to.be.ok;
      expect(json).to.not.eql({});
    });

    describe('package.json JSON data', function () {
      it('must have valid name, description and author', function () {
        expect(json).to.have.property('name', '@postman/codegen-' + codegen);
        expect(json).to.have.property('author', 'Postman Labs <help@getpostman.com>');
        expect(json).to.have.property('license', 'Apache-2.0');
        expect(json).to.have.property('com_postman_plugin');
        expect(json.com_postman_plugin).to.have.property('lang');
        expect(json.com_postman_plugin).to.have.property('type');
        expect(json.com_postman_plugin).to.have.property('variant');
        expect(json.com_postman_plugin).to.have.property('syntax_mode');
        expect(json).to.have.property('engines');
        expect(json.engines).to.eql({
          node: '>=8'
        });
      });

      it('must have a valid version string in form of <major>.<minor>.<revision>', function () {
        // eslint-disable-next-line max-len
        expect(json.version).to.match(/^((\d+)\.(\d+)\.(\d+))(?:-([\dA-Za-z-]+(?:\.[\dA-Za-z-]+)*))?(?:\+([\dA-Za-z-]+(?:\.[\dA-Za-z-]+)*))?$/);
      });
    });


    describe('dependencies', function () {
      it('object must exist', function () {
        expect(json.dependencies).to.be.a('object');
      });

      it('must point to a valid and precise (no * or ^) semver', function () {
        json.dependencies && Object.keys(json.dependencies).forEach(function (item) {
          expect(json.dependencies[item]).to.match(new RegExp('^((\\d+)\\.(\\d+)\\.(\\d+))(?:-' +
            '([\\dA-Za-z\\-]+(?:\\.[\\dA-Za-z\\-]+)*))?(?:\\+([\\dA-Za-z\\-]+(?:\\.[\\dA-Za-z\\-]+)*))?$')); // eslint-disable-line max-len
        });
      });
    });

    describe('devDependencies', function () {
      it('must exist', function () {
        expect(json.devDependencies).to.be.a('object');
      });

      it('must point to a valid and precise (no * or ^) semver', function () {
        json.devDependencies && Object.keys(json.devDependencies).forEach(function (item) {
          expect(json.devDependencies[item]).to.match(new RegExp('^((\\d+)\\.(\\d+)\\.(\\d+))(?:-' +
            '([\\dA-Za-z\\-]+(?:\\.[\\dA-Za-z\\-]+)*))?(?:\\+([\\dA-Za-z\\-]+(?:\\.[\\dA-Za-z\\-]+)*))?$')); // eslint-disable-line max-len
        });
      });

      it('should not overlap dependencies', function () {
        var clean = [];
        json.devDependencies && Object.keys(json.devDependencies).forEach(function (item) {
          !json.dependencies[item] && clean.push(item);
        });
        expect(Object.keys(json.devDependencies)).to.eql(clean);
      });
    });

    describe('main entry script', function () {
      it('must point to a valid file', function (done) {
        expect(json.main).to.equal('index.js');
        fs.stat(mainEntryFileAddress, done);
      });

      it('must return convert function ', function () {
        expect(_.isFunction(require(mainEntryFileAddress).convert)).to.be.true;
      });

      it('must return getOptions function ', function () {
        expect(_.isFunction(require(mainEntryFileAddress).getOptions)).to.be.true;
      });
    });
  });

  describe('getOptions', function () {
    var getOptions = require(mainEntryFileAddress).getOptions,
      options = getOptions();

    it('must be a valid id and should be present in the whitelist of options id', function () {
      options.forEach((option) => {
        expect(option.id).to.be.oneOf(optionsIdFormat,
          'Incorrect option id format. If its a new option please include it in the structure.test for codegens');
      });
    });

    it('must have a valid structure', function () {
      options.forEach((option) => {
        expect(option).to.have.property('name');
        expect(option).to.have.property('id');
        expect(option).to.have.property('type');
        expect(option).to.have.property('default');
        expect(option).to.have.property('description');
      });
    });

    it('must have consistent type, description and name', function () {
      options.forEach((option) => {
        if (expectedOptions[option.id]) {
          // the description property can be different across different languages
          expect(option).to.have.property('description');
          expect(option.name).to.be.eql(expectedOptions[option.id].name);
          expect(option.type).to.be.eql(expectedOptions[option.id].type);
          expect(option.description).to.be.eql(expectedOptions[option.id].description);
        }
        else {
          console.log(`Option ${option.name} not present in the list of expected options.`);
        }
      });
    });
  });

  describe('README.md', function () {
    it('must exist', function (done) {
      fs.stat(`${CODEGEN_ABS_PATH}/README.md`, done);
    });

    it('must have readable content', function () {
      expect(fs.readFileSync(`${CODEGEN_ABS_PATH}/README.md`).toString()).to.be.ok;
    });

  });
  describe.skip('.eslintrc', function () {
    it('must exist', function (done) {
      fs.stat(`${CODEGEN_ABS_PATH}/.eslintrc`, done);
    });

    it('must have readable content', function () {
      expect(fs.readFileSync(`${CODEGEN_ABS_PATH}/.eslintrc`).toString()).to.be.ok;

    });
  });


  describe('.ignore files', function () {
    var gitIgnorePath = `${CODEGEN_ABS_PATH}/.gitignore`,
      gitIgnore = parseIgnore(fs.readFileSync(gitIgnorePath));
    describe(gitIgnorePath, function () {
      it('must exist', function (done) {
        fs.stat(gitIgnorePath, done);
      });
      it('must have valid content', function () {
        expect(_.isEmpty(gitIgnore)).to.not.be.ok;
        expect(gitIgnore).to.include('.DS_Store');
        expect(gitIgnore).to.include('*.log');
        expect(gitIgnore).to.include('.coverage');
        expect(gitIgnore).to.include('node_modules/');
        expect(gitIgnore).to.include('out/');
        expect(gitIgnore).to.include('.npm');
        expect(gitIgnore).to.include('logs');

      });
    });
  });

  describe('lib folder', function () {
    it('must exist', function (done) {
      fs.stat(`${CODEGEN_ABS_PATH}/lib`, done);
    });
  });

});
