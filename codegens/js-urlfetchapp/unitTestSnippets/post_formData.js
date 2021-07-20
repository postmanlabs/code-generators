var formData  = {
  "sdf": "helo",
  "12": "\"23\"",
  "'123'": "1234",
};


// requestTimeout not supported
// See https://issuetracker.google.com/issues/36761852 for more information 

var header = {
};

var options = {
  'method' : 'POST',
  'payload' : formData,
  'header' : header,
};

var response = UrlFetchApp.fetch('https://postman-echo.com/post', options);

Logger.log(response.getContentText());
