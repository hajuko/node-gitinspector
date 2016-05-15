var express = require('express');
var app = express();
var port = 1337;
var Gitinspector = require('./gitinspector');


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

app.get('/web/js/main.js', function(req, res) {
    res.sendfile('web/js/main.js');
});

app.get('/web/css/main.css', function(req, res) {
    res.sendfile('web/css/main.css');
});

app.get('/', function(req, res) {
    res.sendfile('web/index.html');
});

app.listen(port);
console.log('Api started at port: ' + port);

module.exports = app;
