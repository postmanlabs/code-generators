var formData  = {
  "no file": DriveApp.getFileById(file).getBlob(),
  "no src": DriveApp.getFileById(file).getBlob(),
  "invalid src": DriveApp.getFileById(file).getBlob(),
};

var header = {
};

var options = {
  'method' : 'POST',
  'payload' : formData,
  'header' : header,
};

var response = UrlFetchApp.fetch('https://postman-echo.com/post', options);

Logger.log(response.getContentText());
