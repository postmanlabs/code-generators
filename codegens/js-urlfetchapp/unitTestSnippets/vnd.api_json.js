var formData = {"data":{"hello":"world"}};

var header = {
  "Content-Type": "application/vnd.api+json",
};

var options = {
  'method' : 'POST',
  'payload' : formData,
  'header' : header,
};

var response = UrlFetchApp.fetch('https://postman-echo.com/get', options);

Logger.log(response.getContentText());
