var nodeGitInspector;

$(function() {
    nodeGitInspector = new NodeGitInspector();
    //nodeGitInspector.loadIntervalData('portal', '', '2016-01-01', '2016-02-01');
    nodeGitInspector.loadSingleData('portal', '', '2016-01-01', '2016-01-15', nodeGitInspector.drawPie)

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

    function drawStacked(intervals) {
        if (intervals.length === 0) {
            return renderFailed();
        }

        renderHtml(intervals[0].gitinspector.repository);
        console.log(intervals);
        var chartData = [];

        intervals.forEach(function(interval) {
            var changes = interval.gitinspector.changes.authors;

            changes.forEach(function(author) {
                chartData.push({
                    name: author.name,
                    value: author.insertions,
                    month: interval.date
                });
            })
        });

        d3plus.viz()
            .container("#stacked")
            .data(chartData)
            .type("stacked")
            .id("name")
            .text("name")
            .y("value")
            .x("month")
            .time("month")
            .draw();
    }

    function loadSingleData(project, fileTypes, since, until, sucessFn) {
        $.ajax({
            url: '/single?project=' + project +
            '&fileTypes=' + fileTypes +
            '&since=' + since +
            '&until=' + until,
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
                    return gatherer.failed();
                }

                data.date = start;
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
                start: currentDate.format(),
                end: currentDate.endOf('month').format()
            });

            currentDate.add(1, 'd');
        }

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

        console.log(numberOfIntervals);

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