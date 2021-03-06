module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            build: {
                src: 'dev/app.js',
                dest: 'ext/app.min.js'
            }
        },
        watch: {
            grunt: {
                files: ['Gruntfile.js']
            },
            scripts: {
                files: ['dev/app.js','dev/styles.css'],
                tasks: ['uglify', 'cssmin'],
                options: {
                    spawn: false
                }
            },
            dev: {
                files: ['dev/app.js','dev/styles.css'],
                tasks: ['copy', 'cssmin'],
                options: {
                    spawn: false
                }
            }
        },
        cssmin: {
            combine: {
                files: {
                    'ext/styles.min.css': ['dev/styles.css']
                }
            }
        },
        copy: {//for non-minified dev js file
            main: {
                src: 'dev/app.js',
                dest: 'ext/app.min.js'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.registerTask('default', ['watch:scripts']);
    grunt.registerTask('run', ['uglify', 'cssmin']);
    grunt.registerTask('dev', ['watch:dev']);

};