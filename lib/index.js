var sdk = require('postman-collection'),
  labelList = require('./assets/languageLabels.json'),
  languageMap = require('./assets/languages.json');

module.exports = {
  /**
   * Gets the options specific to a given language.
   *
   * @param {Object} language - language key provided by getLanguageList function
   * @param {Array} variant - variant key provided by getLanguageList function
   * @param {Function} callback - callback function with arguments (error, object)
   */
  getOptions (language, variant, callback) {
    var validCodegen = languageMap.filter((codegen) => {
      var lang = codegen.lang.trim(),
        currentVariant = codegen.variant.trim();
      return language === lang.toLowerCase() && variant === currentVariant.toLowerCase();
    });

    validCodegen.forEach((codegen) => {
      main = require(codegen.main);
      if (typeof main.getOptions !== 'function') {
        return callback('Codegen~getOptions: getOptions is not a function');
      }
      if (!main.getOptions) {
        return callback('Codegen~convert: Could not find condegen corresponding to provided language, variant pair');
      }

      return callback(null, main.getOptions());
    });
  },

  /**
   * Returns an object of supported languages
   *
   */
  getLanguageList () {
    var langMap = {},
      supportedLanguages = [];
    languageMap.forEach((codegen) => {
      var lang = codegen.lang.trim(),
        variant = codegen.variant.trim();
      lang = lang.toLowerCase();
      if (!langMap[lang]) {
        langMap[lang] = {
          key: lang,
          label: labelList[lang] ? labelList[lang] : lang,
          variants: [
            {
              key: variant
            }
          ]
        };
      }
      else {
        langMap[lang].variants.push({
          key: variant
        });
      }
    });

    supportedLanguages = Object.keys(langMap).map(function (lang) {
      return langMap[lang];
    });

    return supportedLanguages;
  },

  /**
   * Converts a request to a preferred language snippet
   *
   * @param {Object} language - language key provided by getLanguageList function
   * @param {Array} variant - variant key provided by getLanguageList function
   * @param {String} request -  valid postman request
   * @param {Object} [options] - contains convert level options
   * @param {Number} [options.indentType] - indentation based on tab or spaces 
   * @param {Number} [options.indentCount] - count/frequency of indentType
   * @param {Number} [options.requestTimeout] : time in milli-seconds after which request will bail out
   * @param {Boolean} [options.requestBodyTrim] : whether to trim request body fields
   * @param {Boolean} [options.addCacheHeader] : whether to add cache-control header to postman SDK-request
   * @param {Boolean} [options.followRedirect] : whether to allow redirects of a request
   * @param {Function} callback - callback function with arguments (error, string)
   */
  convert (language, variant, request, options, callback) {
    var convert, main;

    if (!sdk.Request.isRequest(request)) {
      return callback('Codegen~convert: Invalid request');
    }

    languageMap.forEach((codegen) => {
      var lang = codegen.lang.trim(),
        currentVariant = codegen.variant.trim();
      if (language === lang.toLowerCase() && variant === currentVariant.toLowerCase()) {
        main = require(codegen.main);
        convert = main.convert;

        if (typeof convert !== 'function') {
          return callback('Codegen~convert: Convert is not a function');
        }
      }
    });
    if (!convert) {
      return callback('Codegen~convert: Could not find condegen corresponding to provided language, variant pair');
    }


    convert(request, options, function (err, snippet) {
      if (err) {
        return callback(err);
      }

      return callback(null, snippet);
    });
  }
};
