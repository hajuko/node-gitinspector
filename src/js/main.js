$(function () {
  var graphContainer = $('#page-graph').html();
  var dateFormat = 'YYYY-MM-DD';
  var project = 'portal';
  var cacheKey = 'gitData';
  var fileTypes = '';
  var fieldSelection;
  var fields = ['insertions', 'deletions', 'changes', 'commits'];
  var gitData;
  loadCache();
  renderNavigations();
  update();

  function update() {
    var field = fieldSelection.val();
    var from = moment($('#startdate').val(), dateFormat);
    var until = moment($('#enddate').val(), dateFormat);
    var result = [];

    console.log(gitData.data);

    $.each(gitData.data, (i, group) => {
      $.each(group, (j, entry) => {
        result.push(entry);
      });
    });

    result = result.filter(entry => {
      return checkedAuthors().indexOf(entry.name) != -1;
    }).filter(entry => {
      var date =  moment(entry.date);
      return date >= from && date <= until;
    }).sort((entryA, entryB) => {
      return moment(entryA.date) - moment(entryB.date);
    });

    drawGraph(result, field);
  }

  function drawGraph(data, field) {
    renderGraphContainer(field);
    var chartData = [];

    data.forEach(author => {
      var obj = {
        name: author.name,
        month: author.date
      };
      obj[field] = author[field];
      chartData.push(obj);
    });

    d3plus.viz()
        .container('#' + field)
        .data(chartData)
        .type('stacked')
        .id('name')
        .text('name')
        .y(field)
        .x('month')
        .draw();
  }

  function loadSingleInterval(start, end) {
    return $.ajax({
      url: '/single?project=' + project + '&fileTypes=' + fileTypes + '&since=' + start +
      '&until=' + end,
      cache: false,
      success: data => {
        if (data.gitinspector.exception) {
          console.log('failed: ' + start);
          console.log(data);

          return;
        }

        saveData(data);
        updateCache();
        removeSpinner(start);
      },
      error: err => console.log(err)
    });
  }

  function createTimeInterval(since, until) {
    var start = moment(since, dateFormat).startOf('month');
    var end = moment(until, dateFormat).startOf('month');
    var currentDate = start;
    var intervals = [];

    while (currentDate <= end) {
      currentDate.startOf('month');
      intervals.push(currentDate.format(dateFormat));
      currentDate.add(1, 'months');
    }

    return intervals;
  }

  function loadIntervalData(since, until) {
    var calls = [];
    var intervals = createTimeInterval(since, until);

    $('#graph-container').html('<h4>Loading Data..</h4>');
    intervals.forEach(interval => {
      calls.push(loadSingleInterval(
        interval,
        moment(interval, dateFormat).endOf('month').format(dateFormat)
      ));

      addSpinner(interval);
    });

    $.when.apply($, calls).done(function() {
      console.log('new data loaded');
      renderNavigations();
      update();
    });
  }

  function saveData(data) {
    var date = data.date;
    gitData.data[date] = {};

    data.gitinspector.blame.authors.forEach((blameByAuthor, i) => {
      var changesByAuthor = data.gitinspector.changes.authors[i];
      var author = {
        name: changesByAuthor.name,
        date: date,
        insertions: changesByAuthor.insertions,
        deletions: changesByAuthor.deletions,
        changes: changesByAuthor.insertions + changesByAuthor.deletions,
        commits: changesByAuthor.commits,
        percentageOfChanges: changesByAuthor.percentage_of_changes,
        percentageInComments: blameByAuthor.percentage_in_comments,
        rows: blameByAuthor.rows,
        stability: blameByAuthor.stability
      };

      gitData.data[date][author.name] = author;
      gitData.authors[author.name] = {
        name: author.name,
        email: author.email,
        icon: author.icon
      };
    });

    $.each(gitData.authors, (i, author) => {
      if (!gitData.data[date][author.name]) {
        console.log(author.name);
        console.log(data);

        gitData.data[date][author.name] = {
          name: author.name,
          date: date,
          insertions: 0,
          deletions: 0,
          changes: 0,
          commits: 0,
          percentageOfChanges: 0,
          percentageInComments: 0,
          rows: 0,
          stability: 0
        }
      };
    });
  }

  function loadCache() {
    gitData = JSON.parse(localStorage.getItem(cacheKey)) || {data: {}, authors: {}};
    console.log('loading cache');
    console.log(gitData);
  }

  function updateCache() {
    localStorage.setItem(cacheKey, JSON.stringify(gitData));
  }

  function renderNavigations() {
    var startDate = gitData.startDate || '2016-01-01';
    var endDate = gitData.endDate || '2016-02-01';
    $('#navigation').html(_.template($('#template-navigation').html())({fields: fields}));
    $('#sidebar').html(_.template($('#template-sidebar').html())(
      {
        authors: gitData.authors,
        startDate: startDate,
        endDate: endDate
      })
    );

    fieldSelection = $('#field-selection');
    fieldSelection.on('change', update);
    $('#update-button').on('click', () => {
      update();
      saveSettings();
      $('#sidebar').removeClass('is-visible');
      $('.mdl-layout__obfuscator').removeClass('is-visible');
    });

    $('#load-data-button').on('click', () => {
      loadIntervalData($('#startdate').val(), $('#enddate').val())
      saveSettings();
    });

    componentHandler.upgradeDom();
  }

  function checkedAuthors() {
    var authors = [];
    $('.author-checkbox:checked').each(function(){
      authors.push($(this).val());
    });

    return authors;
  }

  function renderGraphContainer(field) {
    $('#graph-container').html(_.template(graphContainer)({field: field}));
  }

  function addSpinner(date) {
    $('#graph-container').append(_.template($('#template-spinner').html())({date: date}));
    componentHandler.upgradeDom();
  }

  function removeSpinner(date) {
    $('#spinner-' + date).remove();
  }

  function saveSettings() {
    gitData.startDate = $('#startdate').val();
    gitData.endDate = $('#enddate').val();
    updateCache();
  }
});
