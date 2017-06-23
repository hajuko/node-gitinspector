const PythonShell = require('python-shell');
const fs = require('fs');
const util = require('util');
const exec = require('child_process').exec;

var create = function (parameters, serverResponse) {
  function run() {
    let gitLines;
    const options = {
      scriptPath: parameters.gitinspectorPath,
      args: [parameters.projectPath,
        '--format=json',
        '--timeline=true', '-r']
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

    let dirName = 'projects/' + parameters.projectName + '/';

    checkDirectorySync(dirName);

    let fileName = dirName + parameters.since + '.json';

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


      let cmd = createCmd(date);
      console.log(cmd);
      return exec(cmd, function(error, stdout, stderr) {
        console.log(stdout);

        result.lines = JSON.parse(stdout);



        fs.writeFile(fileName, JSON.stringify(result), function (err) {
          if (err) {
            return console.log(err);
          }
          console.log('The file was saved! ' + fileName);

          exec('cd /home/julien/Documents/rx.portal && git checkout dev', function(a, b, c) {
            return serverResponse.send(result);
          });
        });
      });
    });
  }

  function appendAuthorFilter(options, parameters) {
    parameters.filteredAuthors.forEach(function (author) {
      options.args.push('--exclude=author:' + author);
    });
  }

  function appendPathFilter(options, parameters) {
    parameters.filteredPaths.forEach(function (path) {
      options.args.push('--exclude=file:' + path);
    });
  }

  function appendAllowedFileTypes(options, parameters) {
    if (!parameters.fileTypes) {
      return;
    }

    options.args.push('--file-types=' + parameters.fileTypes);
  }

  function checkDirectorySync(directory) {
    try {
      fs.statSync(directory);
    } catch (e) {
      fs.mkdirSync(directory);
    }
  }

  function createCmd(date) {
    return 'cd /home/julien/Documents/rx.portal/src && git checkout `git rev-list -n 1 --before="' + date + '" dev` && cloc --vcs=git --json';
  }

  this.run = run;
};

exports.create = create;
