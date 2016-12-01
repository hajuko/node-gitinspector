var express = require('express');
const app = express();
const port = 1337;
const Gitinspector = require('./gitinspector');


app.use(express.static(__dirname + '/public'));


app.get('/codelines', function(req, res) {

});

app.get('/single', function (req, res) {
  const projectConfig = req.param('project');
  const parameters = require('./projects/' + projectConfig + '.json');
  const fileTypes = req.param('fileTypes');
  parameters.since = req.param('since');
  parameters.until = req.param('until');
  parameters.projectName = projectConfig;

  if (fileTypes) {
    parameters.fileTypes = fileTypes;
  }
  const gitinspector = new Gitinspector.create(parameters, res);
  gitinspector.run();
});

app.listen(port);
console.log('Api started at port: ' + port);
module.exports = app;

