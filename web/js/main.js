$(function() {
    $.ajax({
        url: '/stats?project=rxportal',
        cache: false,
        success: function(data) {
            render(data);
        },
        error: function(data) {

        }
    });

    function render(data) {
        console.log(data);
        var contentTemplate = $('#page-content').html();

        var templateOptions = {
            headline: 'fubar'
        };

        $('body').html(_.template(contentTemplate)(templateOptions));

        drawPie(data);
    }

    function drawPie(data) {
        var changes = data.gitinspector.changes.authors;
        var insertions = changes.map(function(author) {
            return {
                name: author.name,
                value: author.insertions
            }
        });

        d3plus.viz()
            .container("#pie-chart-insertions")
            .data(insertions)
            .type("pie")
            .id("name")
            .size("value")
            .draw()
    }
});
