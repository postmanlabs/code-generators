var formData = {"json":"Test-Test"};

var header = {
  "Content-Type": "application/json",
};

var options = {
  'method' : 'POST',
  'payload' : formData,
  'header' : header,
};

var response = UrlFetchApp.fetch('https://postman-echo.com/post', options);

Logger.log(response.getContentText());
