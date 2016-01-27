;(function buildEncolsure() {
    var params = require('./params.json');
    var gulp = require ('gulp');

    var less = require ('gulp-less');
    var LessPluginCleanCSS = require ('less-plugin-clean-css'),
        LessPluginAutoPrefix = require ('less-plugin-autoprefix'),
        cleancss = new LessPluginCleanCSS({ advanced: true }),
        autoprefix= new LessPluginAutoPrefix({ browsers: ["last 2 versions"] });

    var uglify = require('gulp-uglify');
    var gulpMerge = require ('gulp-merge'),
        concat = require ('gulp-concat');
    var connect = require ('gulp-connect');
    var fs = require ('fs');
    var TPL = require ('./vendor/o.min.js');

    var i18nFolder = './i18n';
    var allTemplatesFiles = './templates/**/*.html';

    var cssUrl = '/css';
    var cssFolder = '.' + cssUrl;
    var combinedCssFile = 'stylesheet.min.css';
    var lessFolder = './less';
    var allLessFiles = lessFolder + '/**/*.less';

    var jsUrl = '/js';
    var jsFolder = '.' + jsUrl;
    var allJsFiles =  jsFolder + '/**/*.js';
    var combinedJsFile = 'code.min.js';

    gulp.task('connect', function connectTask () {
        connect.server({
            livereload: true
        });
    });

    gulp.task('reconnect', function htmlTask () {
        connect.reload();
       // gulp.src('./*.html')
       //     .pipe();
    });

    gulp.task('render-less', function () {
        if (!fs.existsSync(cssFolder)){
            fs.mkdirSync(cssFolder);
        }
        return gulpMerge(
            gulp.src(allLessFiles)
                .pipe(less({plugins : [cleancss, autoprefix]}))
                .pipe(gulp.dest(cssFolder))
        )
            .pipe(concat(combinedCssFile))
            .pipe(gulp.dest('./'));
    });

    gulp.task('render-js', function () {
        return gulpMerge(
            gulp.src(allJsFiles)
                .pipe(uglify())
        )
            .pipe(concat(combinedJsFile))
            .pipe(gulp.dest('./'));
    });

    function getFileList (folder, prefix) {
        var files = fs.readdirSync(folder);
        if (prefix !== undefined) {
            var prefixed = [];
            while (files.length) {
                prefixed.push(prefix + files.pop());
            }
            return prefixed
        } else {
            return files;
        }
    }
    gulp.task('render-index', function createIndexTask () {
        TPL.setLocale(params.language);
        TPL.loadLanguage('.'+i18nFolder + '/' + params.language + '.json');

        fs.readFile ('./templates/index.src.html', 'utf-8', function (err, template) {
            var data = {
                prod: {
                    stylesheets:{ stylesheet: [ combinedCssFile ] },
                    scripts: { script: [ combinedJsFile ] }
                },
                dev: {
                    stylesheets:{stylesheet: getFileList (cssFolder, cssUrl + '/')  },
                    scripts: { script: getFileList (jsFolder, jsUrl + '/') }
                }
            };

            fs.writeFile('./index.dev.html', TPL.render (template, data.dev), function (err) {
                if (err) {
                    throw err;
                }
            });

            fs.writeFile('./index.html', TPL.render (template, data.prod), function (err) {
                if (err) {
                    throw err;
                }
            });
        });
    });

    function watchTask () {
        gulp.watch([allJsFiles], ['render-js','reconnect']);
        gulp.watch([allLessFiles], ['render-less','reconnect']);
        gulp.watch([allTemplatesFiles], ['render-index','reconnect']);
    }

    gulp.task('watch', watchTask);

    gulp.task('default', ['render-js','render-less','render-index','connect'], function () {
        watchTask ();
    });

})();
