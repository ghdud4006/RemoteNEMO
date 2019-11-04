var express = require('express');
var app = express();

app.get('*', function (req, res) {
  res.redirect('https://115.145.170.214:9002');
});

app.listen(3000, function () {
  console.log('RemoteNEMO http server listening at 0.0.0.0:3000');
});
