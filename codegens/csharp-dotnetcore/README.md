# codegen-csharp-dotnetcore

> Converts Postman-SDK Request into code snippet for Csharp-dotnetcore.

#### Prerequisites
To run Code-Gen, ensure that you have NodeJS >= v6. A copy of the NodeJS installable can be downloaded from https://nodejs.org/en/download/package-manager.

## Using the Module
The module will expose an object which will have property `convert` which is the function for converting the Postman-SDK request to Csharp-dotnetcore code snippet.

### convert function
Convert function will take three parameters
* `request`- Postman-SDK Request object

* `options`- options is an object which can have following properties
    * `indentType`- Character used for indentation
    * `indentCount`- Number of indentation characters to add per code level
    * `includeBoilerplate` - Include class definition and import statements in snippet
    * `requestTimeout` : How long the request should wait for a response before timing out (milliseconds)
    * `trimRequestBody` : Trim request body fields
    * `followRedirect` : Automatically follow HTTP redirects

* `callback`- callback function with first parameter as error and second parameter as string for code snippet

##### Example:
```js
var request = new sdk.Request('www.google.com'),  //using postman sdk to create request  
    options = {
        indentType: 'space',
        indentCount: 2,
        includeBoilerplate: false
    };
convert(request, options, function(error, snippet) {
    if (error) {
        //  handle error
    }
    //  handle snippet
});
```

### Guideline for using generated snippet
* Generated snippet requires dependecies [mono-complete](https://www.mono-project.com/download/stable/#download-lin) to compile and run

* Since Postman-SDK Request object doesn't provide complete path of the file, it needs to be manually inserted in case of uploading a file.

* `content-type` needs to be specified in order to add body to the request. So if no `content-type` is specified then `text/plain` will be used as default. **In case of `multipart/formdata` `content-type` is generated by snippet itself**.

* This module doesn't support cookies.