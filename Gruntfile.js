module.exports = function (grunt) {
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    less: {
      development: {
        options: {
          yuicompress: true,
          optimization: 2
        },
        files: {
          'public/css/node-inspector.css': 'src/less/main.less'
        }
      }
    },
    babel: {
      options: {
        presets: ['babel-preset-es2015']
      },
      dist: {
        files: {
          'public/js/node-gitinspector.js': 'src/js/main.js'
        }
      }
    },
    watch: {
      styles: {
        files: ['src/less/**/*.less', 'src/js/main.js'],
        tasks: ['less', 'babel'],
        options: {
          nospawn: true,
          livereload: true
        }
      }
    }
  });

  grunt.registerTask('default', ['less', 'watch']);
};
