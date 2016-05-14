var PythonShell = require('python-shell');

function run(parameters, serverResponse) {
    var options = {
        scriptPath: parameters.gitinspectorPath,
        args : [
            parameters.projectPath,
            '--format=json'
        ]
    };

    appendAuthorFilter(options, parameters);
    appendAllowedFileTypes(options, parameters);
    appendPathFilter(options, parameters);

    if (parameters.since) {
        options.args.push('--since=' + parameters.since);
    }

    if (parameters.until) {
        options.args.push('--until=' + parameters.until);
    }

    PythonShell.run('gitinspector.py', options, function (err, gitData) {
        if (err) {
            throw err;
        }
        var result = JSON.parse(gitData.join(''));

        result.parameters = parameters;

        serverResponse.send(result);
    });
}

function appendAuthorFilter(options, parameters) {
    parameters.filteredAuthors.forEach(function(author) {
        options.args.push('--exclude=author:' + author);
    });
}

function appendPathFilter(options, parameters) {
    parameters.filteredPaths.forEach(function(path) {
        options.args.push('--exclude=file:' + path);
    });
}

function appendAllowedFileTypes(options, parameters) {
    if (!parameters.fileTypes) {
        return;
    }

    options.args.push('--file-types=' + parameters.fileTypes);
}

exports.run = run;
