/*
**
**  filename : dataconnector.js
**  nodejs version : 7.5.0 (https://nodejs.org/dist/v7.5.0/)
**  code description : connect to each article's saved data
**    for each article's url, title, date, etc..
**  using module :
**  created by : CLP
**
*/
var express = require('express');
var execSync = require('child_process').execSync;
var fs = require('fs');
var app = express();
var datapath = '/home/pi/newscrap/itworld/';

app.get('/:year', function (req, res) {
  res.send(execSync('ls '+datapath+req.params.year).toString());
});
app.get('/:year/:month', function (req, res) {
  res.send(execSync('ls '+datapath+req.params.year+'/'+req.params.month).toString());
});
app.get('/:year/:month/:date', function (req, res) {
  res.send(execSync('ls '+datapath+req.params.year+'/'+req.params.month+'/'+req.params.date).toString());
});
app.get('/:year/:month/:date/:filename', function (req, res) {
  if(req.params.filename.match('.json')){
    res.send(execSync('cat '+datapath+req.params.year+'/'+req.params.month+'/'+req.params.date+'/'+req.params.filename).toString());
  }else{
    res.send(fs.readFileSync(datapath+req.params.year+'/'+req.params.month+'/'+req.params.date+'/'+req.params.filename));
  }
});
app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
