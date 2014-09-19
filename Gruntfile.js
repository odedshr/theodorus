module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        qunit: {
            all: ['tests/main.js']
        },

        recess: {
            test_and_minify_css: {
                options: {
                    compile: true,
                    compress: true
                },
                files: {
                    'build/www/themes/default/core.css': ['static/themes/default/css/base.less'],
                    'build/www/themes/default.rtl/core.css': ['static/themes/default.rtl/css/base.less']
                }
            }
        },

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

        copyto: {
            copy_files_to_build: {
                files: [
                    { cwd: '.', src: ['package.json','LICENSE','README.md'], dest: 'build/'},
                    { cwd: 'node_modules', src: ['cheerio/**', 'backbone/**', 'cookie-parser/**', 'express/**', 'formidable/**', 'imagemagick/**', 'mysql/**', 'node_xslt/**', 'nodemailer/**', 'orm/**', 'underscore/**'], dest: 'build/node_modules/'},
                    { cwd: 'src', src: ['server.js','config.json','app/**'], dest: 'build/'},
                    { cwd: 'src', src: ['themes/**'], dest: 'build/www/themes/', filter:'isFile' },
                    { cwd: 'src', src: ['processes/**'], dest: 'build/app/', filter:'isFile' },
                    { cwd: 'src', src: ['models/**'], dest: 'build/app/', filter:'isFile' },
                    { cwd: 'src', src: ['db/**'], dest: 'build/app/', filter:'isFile' },
                    { cwd: 'src', src: ['utils/**'], dest: 'build/app/', filter:'isFile' },
                    { cwd: 'static', src: ['**'], dest: 'build/www/'},
                    { cwd: '.', src: ['plugins/**'], dest: 'build/www/'}
                ],
                options: {
                    ignore: [
                        'static/**/css{,/**/*}'
                    ]
                }
            }
        },

        jsdoc : {
            // http://usejsdoc.org/howto-commonjs-modules.html
            dist : {
                src: ['src/**/*.js', 'tests/**/*.js', 'plugins/**/*.js', 'static/themes/**/*.js'],
                options: {
                    destination: 'build/docs'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    //TODO add: grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-copy-to');
    //grunt.loadNpmTasks('grunt-jsdoc');
    grunt.loadNpmTasks('grunt-recess');

    //TODO: add qunit, jsdoc

    // Default task(s).
    grunt.registerTask('default', ['jshint','copyto','recess','uglify']);
};