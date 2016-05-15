var PythonShell = require('python-shell');
var fs = require('fs');

var create = function(parameters, serverResponse) {
    function run() {
        var options = {
            scriptPath: parameters.gitinspectorPath,
            args : [
                parameters.projectPath,
                '--format=json',
                '--timeline=true',
                '-r'
            ]
        };

        const date = parameters.since;

        appendAuthorFilter(options, parameters);
        appendAllowedFileTypes(options, parameters);
        appendPathFilter(options, parameters);

        if (parameters.since) {
            options.args.push('--since=' + parameters.since);
        }

        if (parameters.until) {
            options.args.push('--until=' + parameters.until);
        }
        let fileName = 'projects/' + parameters.projectName + '/' + parameters.since + '.json';

        var start = new Date();

        if (fs.existsSync(fileName)) {
            var result = fs.readFileSync(fileName);

            var duration = new Date() - start;
            console.log('>>>> File cached! finished in: ' + duration + ' ms <<<< ' + date);

            return serverResponse.send(JSON.parse(result));
        }

        PythonShell.run('gitinspector.py', options, function (err, gitData) {
            if (err) {
                throw err;
            }
            var result = JSON.parse(gitData.join(''));

            if (result.gitinspector.changes) {
                console.log(result.gitinspector.changes.authors[0]);
            }

            result.date = date;
            delete result.gitinspector.filtering;

            var duration = new Date() - start;
            console.log('>>>> finished in: ' + duration + ' ms <<<<');


            fs.writeFile(fileName, JSON.stringify(result), function(err) {
                if(err) {
                    return console.log(err);
                }

                console.log("The file was saved! " + fileName);
            });
            return serverResponse.send(result);
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

    this.run = run;
};

exports.create = create;


