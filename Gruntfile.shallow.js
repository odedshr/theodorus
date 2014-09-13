module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            options : {
                reporterOutput: "logs/jshint.log"
            },
            all: ['Gruntfile.js', 'src/**/*.js', 'tests/**/*.js', 'static/themes/**/*.js']
        },

        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            hash_clientside_js: {
                files: {
                    'build/www/js/<%= pkg.name %>.models.min.js':['src/modes/AbstractModel.js', 'src/models/Comments.js', 'src/models/Comments.js', 'src/models/Community.js', 'src/models/Credentials.js', 'src/models/ModelUpdate.js', 'src/models/Topic.js', 'src/models/User.js'],
                    'build/www/js/<%= pkg.name %>.controllers.min.js': ['src/controllers/AbstractController.js', 'src/controllers/AccountController.js', 'src/controllers/FeedController.js', 'src/controllers/TopicController.js'],
                    'build/www/js/<%= pkg.name %>.views.min.js': ['src/views/AbstractView.js', 'src/views/AccountView.js', 'src/views/FeedView.js', 'src/views/TopicView.js'],
                    'build/www/js/<%= pkg.name %>.utils.min.js': ['src/utils/Encryption.js', 'src/views/ErrorHandler.js', 'src/utils/ExternalWindow.js', 'src/utils/FormGrabber.js', 'src/utils/PrettyDate.js', 'src/utils/XSLTRenderer.js'],
                    'build/www/js/<%= pkg.name %>.min.js': ['src/www/<%= pkg.name %>.js']
                }
            }
        },

        copy: {
            copy_files_to_build: {
                files: [
                    {expand: true, cwd: 'static/', src: ['**'], dest: 'build/www'},
                    {expand: true, cwd: '', src: ['plugins/**'], dest: 'build/www'}
                ]
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-jshint');

    // Default task(s).
    grunt.registerTask('default', ['jshint','copy','uglify']);

};