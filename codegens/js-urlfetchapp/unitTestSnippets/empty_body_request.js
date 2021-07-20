var formData = {};

var header = {
};

var options = {
  'method' : 'GET',
  'payload' : formData,
  'header' : header,
};

var response = UrlFetchApp.fetch('https://postman-echo.com/get', options);

Logger.log(response.getContentText());
