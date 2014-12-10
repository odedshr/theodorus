module.exports = function(grunt) {
    var npms = [
            'grunt-forever',
            'grunt-contrib-clean',
            'grunt-contrib-uglify',
            'grunt-contrib-jshint',
            'grunt-contrib-copy',
            'grunt-rename',
            'grunt-recess',
        ],
        config = {
            pkg: grunt.file.readJSON('package.json'),

            clean: ["build.old", "build.new"],

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
                        'build.new/www/themes/default/core.css': ['static/www/themes/default/css/base.less'],
                        'build.new/www/themes/default.rtl/core.css': ['static/www/themes/default.rtl/css/base.less']
                    }
                }
            },

            jshint: {
                options : {
                    /*reporterOutput: "logs/jshint.log"*/
                },
                all: ['Gruntfile.js', 'src/**/*.js', 'tests/**/*.js', 'static/www/themes/**/*.js']
            },

            uglify: {
                options: {
                    banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
                },
                hash_clientside_js: {
                    files: {
                        'build.new/www/js/<%= pkg.name %>.models.min.js':['src/modes/AbstractModel.js', 'src/models/Comments.js', 'src/models/Comments.js', 'src/models/Community.js', 'src/models/Credentials.js', 'src/models/ModelUpdate.js', 'src/models/Topic.js', 'src/models/User.js'],
                        'build.new/www/js/<%= pkg.name %>.controllers.min.js': ['src/controllers/AbstractController.js', 'src/controllers/AccountController.js', 'src/controllers/FeedController.js', 'src/controllers/TopicController.js'],
                        'build.new/www/js/<%= pkg.name %>.views.min.js': ['src/views/AbstractView.js', 'src/views/AccountView.js', 'src/views/FeedView.js', 'src/views/TopicView.js'],
                        'build.new/www/js/<%= pkg.name %>.utils.min.js': ['src/utils/Encryption.js', 'src/views/ErrorHandler.js', 'src/utils/ExternalWindow.js', 'src/utils/FormGrabber.js', 'src/utils/PrettyDate.js', 'src/utils/XSLTRenderer.js'],
                        'build.new/www/js/<%= pkg.name %>.min.js': ['src/www/<%= pkg.name %>.js']
                    }
                }
            },

            copy: {
                everything: {
                    files: [
                        { cwd: '.', src: ['package.json','LICENSE','README.md'], dest: 'build.new/'},
                        { cwd: 'node_modules', src: ['cheerio/**', 'backbone/**', 'cookie-parser/**', 'express/**', 'formidable/**', 'imagemagick/**', 'mysql/**', 'nodemailer/**', 'orm/**', 'underscore/**'], dest: 'build.new/node_modules/'},
                        { cwd: 'src', src: ['server.js','*.json','app/**'], dest: 'build.new/'},
                        { cwd: 'src', src: ['themes/**'], dest: 'build.new/www/themes/', filter:'isFile' },
                        { cwd: 'src', src: ['processes/**'], dest: 'build.new/app/', filter:'isFile' },
                        { cwd: 'src', src: ['models/**'], dest: 'build.new/app/', filter:'isFile' },
                        { cwd: 'src', src: ['db/**'], dest: 'build.new/app/', filter:'isFile' },
                        { cwd: 'src', src: ['utils/**'], dest: 'build.new/app/', filter:'isFile' },
                        { cwd: 'static/.openshift', src: ['**'], dest: 'build.new/.openshift/'},
                        { cwd: 'static', src: ['**'], dest: 'build.new/'},
                        { cwd: '.', src: ['plugins/**'], dest: 'build.new/www/'}
                    ],
                    options: {
                        ignore: [
                            'static/www/**/css{,/**/*}'
                        ],
                        mode: true
                    }
                },

                rebuild_client_side: {
                    files: [
                        { cwd: '.', src: ['package.json','LICENSE','README.md'], dest: 'build/'},
                        { cwd: 'src', src: ['themes/**'], dest: 'build/www/themes/', filter:'isFile' },
                        { cwd: 'static', src: ['**'], dest: 'build/'},
                        { cwd: '.', src: ['plugins/**'], dest: 'build/www/'}
                    ],
                    options: {
                        ignore: [
                            'static/www/**/css{,/**/*}'
                        ]
                    }
                },

                rebuild_xslt: {
                    files: [
                        { cwd: '.', src: ['package.json','LICENSE','README.md'], dest: 'build.new/'},
                        { cwd: 'src', src: ['themes/**'], dest: 'build.new/www/themes/', filter:'isFile' },
                    ],
                    options: {
                        ignore: [
                            'static/www/**/css{,/**/*}'
                        ]
                    }
                }
            },

            jsdoc : {
                // http://usejsdoc.org/howto-commonjs-modules.html
                dist : {
                    src: ['src/**/*.js', 'tests/**/*.js', 'plugins/**/*.js', 'static/www/themes/**/*.js'],
                    options: {
                        destination: 'build.new/docs'
                    }
                }
            },
            rename: {
                currentToOld: {
                    src: 'build',
                    dest: 'build.old'
                },

                // Any number of targets here...

                newToCurrent: {
                    src: 'build.new',
                    dest: 'build'
                }
            },

            forever: {
                start: {
                    options: {
                        operation: "start",
                        index: 'build/server.js',
                        logDir: 'logs'
                    }
                },

                stop: {
                    options: {
                        operation: "stop",
                        index: 'build/server.js',
                        logDir: 'logs'
                    }
                },

                restart: {
                    options: {
                        operation: "restart",
                        index: 'build/server.js',
                        logDir: 'logs'
                    }
                }
            }

        };

    grunt.initConfig(config);

    npms.forEach(function (npm) {
        grunt.loadNpmTasks(npm);
    });
    //grunt.registerTask('test', ['qunit']);
    grunt.registerTask('build', ['clean', 'jshint','copy:everything','recess','uglify']);
    grunt.registerTask('client-side', ['jshint','copy:rebuild_client_side','recess','uglify']);
    grunt.registerTask('default', ['clean','jshint','copy:everything','recess','uglify','rename:currentToOld','rename:newToCurrent','forever:start']);
    grunt.registerTask('stop-and-default', ['forever:stop','clean','jshint','copy:everything','recess','uglify','rename:currentToOld','rename:newToCurrent','forever:start']);
    //grunt.loadNpmTasks('grunt-jsdoc');
    //TODO: add qunit, jsdoc


};