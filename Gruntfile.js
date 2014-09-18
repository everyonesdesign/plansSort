module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            build: {
                src: 'dev/app.js',
                dest: 'ext/app.min.js'
            },
            coffee: {
                src: 'dev/app-coffee.js',
                dest: 'ext/app.min.js'
            }
        },
        watch: {
            grunt: {
                files: ['Gruntfile.js']
            },
            scripts: {
                files: ['dev/app.js','dev/styles.css', 'dev/*.coffee'],
                tasks: ['run'],
                options: {
                    spawn: false
                }
            }
        },
        coffee: {
            compile: {
                files: {
                    'dev/app-coffee.js': 'dev/coffee/*.coffee' // 1:1 compile
                }
            }
        },
        cssmin: {
            combine: {
                files: {
                    'ext/styles.min.css': ['dev/styles.css']
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-coffee');

    grunt.registerTask('run', ['coffee', 'uglify:coffee', 'cssmin']);
    grunt.registerTask('default', ['watch']);

};