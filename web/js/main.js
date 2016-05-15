var nodeGitInspector;

$(function() {
    nodeGitInspector = new NodeGitInspector();
    nodeGitInspector.loadIntervalData('core', '', '2016-01-01', '2016-05-01');
    //nodeGitInspector.loadSingleData('portal', '', '2016-01-01', '2016-01-15', nodeGitInspector.drawPie)

    //$('#update').on('click', function() {
    //    nodeGitInspector.loadSingleData('seatmap', 'html,js', '2016-01-01');
    //})
});

function NodeGitInspector() {
    function renderHtml(repositoryName) {
        var contentTemplate = $('#page-content').html();

        var templateOptions = {
            headline: repositoryName
        };

        $('#graph-container').html(_.template(contentTemplate)(templateOptions));
    }

    function renderFailed(repositoryName) {
        var contentTemplate = $('#page-content-failed').html();

        var templateOptions = {
            headline: repositoryName
        };

        $('#graph-container').html(_.template(contentTemplate)(templateOptions));
    }

    function drawPie(data) {
        renderHtml(data.gitinspector.repository);
        var changes = data.gitinspector.changes.authors;
        var chartData = changes.map(function(author) {
            return {
                name: author.name,
                value: author.insertions
            };
        });

        console.log(chartData);

        d3plus.viz()
            .container("#pie-chart-insertions")
            .data(chartData)
            .type("pie")
            .id("name")
            .size("value")
            .draw();
    }

    function gatherAuthors(intervals, path) {
        var _authors = {};
        intervals.forEach(function(interval) {
            var authors = interval.gitinspector[path].authors;

            authors.forEach(function(author) {
                _authors[author.name] = author.name;
            })
        });

        return _authors;
    }

    function drawStacked(intervals) {
        if (intervals.length === 0) {
            return renderFailed();
        }

        console.log('number of months: ' + intervals.length);

        renderHtml(intervals[0].gitinspector.repository);
        var chartData = [];
        var authors = gatherAuthors(intervals, 'changes');

        console.log(authors);

        intervals.forEach(function(interval) {
            var changes = interval.gitinspector.changes.authors;

            loop1:
            for (var i = 0, len = Object.keys(authors).length; i < len; i++) {
                var authorName = authors[Object.keys(authors)[i]];

                for (var j = 0, len2 = changes.length; j < len2; j++) {
                    var author = changes[j];

                    if (author.name == authorName) {
                        chartData.push({
                            name: authorName,
                            value: author.insertions,
                            month: interval.date
                        });

                        continue loop1;
                    }
                }

                chartData.push({
                    name: authorName,
                    value: 0,
                    month: interval.date
                });
            }
        });

        console.log(chartData);

        d3plus.viz()
            .container("#stacked")
            .data(chartData)
            .type("stacked")
            .id("name")
            .text("name")
            .y("value")
            .x("month")
            .time("MonthSmall")
            .draw();
    }

    function loadSingleData(project, fileTypes, since, until, sucessFn) {
        $.ajax({
            url: '/single?project=' + project +
            '&fileTypes=' + fileTypes +
            '&since=' + since +
            '&until=' + until,
            timeout: 0,
            cache: false,
            success: sucessFn,
            error: function(data) {

            }
        });
    };

    function loadSingleInterval(project, fileTypes, start, end, gatherer) {
        $.ajax({
            url: '/single?project=' + project +
            '&fileTypes=' + fileTypes +
            '&since=' + start +
            '&until=' + end,
            cache: false,
            success: function(data) {
                if (data.gitinspector.exception) {
                    console.log('failed: ' + end);

                    return gatherer.failed();
                }

                console.log('success: ' + end);

                gatherer.addData(data);
            },
            error: function() {
                gatherer.failed();
            }
        });
    };

    function loadIntervalData(project, fileTypes, since, until) {
        var start = moment(since).startOf('month');
        var end = moment(until).endOf('month');
        var intervals = [];
        var currentDate = start;

        while (currentDate <= end) {
            currentDate.startOf('month');

            intervals.push({
                start: currentDate.format('YYYY-MM-DD'),
                end: currentDate.endOf('month').format('YYYY-MM-DD')
            });

            currentDate.add(1, 'd');
        }
        console.log('intervals: ' + intervals.length);

        var dataGatherer = new DataGatherer(intervals.length, drawStacked);

        intervals.forEach(function(interval) {
            loadSingleInterval(project, fileTypes, interval.start, interval.end, dataGatherer);
        });
    }

    this.loadIntervalData = loadIntervalData;
    this.loadSingleData = loadSingleData;
    this.drawPie = drawPie;
}

function DataGatherer(numberOfIntervals, sucessFn) {
    var intervalls = [];

    this.addData = function(data) {
        intervalls.push(data);
        numberOfIntervals--;

        if (numberOfIntervals == 0) {
            sucessFn(intervalls);
        }
    };

    this.failed = function() {
        numberOfIntervals--;

        if (numberOfIntervals == 0) {
            sucessFn(intervalls);
        }
    };
}