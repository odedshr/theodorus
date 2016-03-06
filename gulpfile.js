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
    var fs = require ('fs');
    var TPL = require ('./vendor/o.min.js');

    var root = '.';
    var devDeploy = '/_deploy.dev';
    var rootDeploy = ''.concat(root, '/_deploy');
    var rootDevDeploy = ''.concat(root, '/_deploy.dev');
    var i18nFolder = './i18n';
    var templatesFolder = './templates';
    var allTemplatesFiles = templatesFolder + '/**/*.html';

    var cssUrl = 'css';
    var cssDevDeployFolder = ''.concat(root, devDeploy, '/',cssUrl);
    var combinedCssFile = 'stylesheet.min.css';
    var lessFolder = './less';
    var allLessFiles = lessFolder + '/**/*.less';

    var jsUrl = 'js';
    var jsFolder = ''.concat(root,'/', jsUrl);
    var jsDevDeployFolder = ''.concat(rootDevDeploy, '/', jsUrl);
    var allJsFiles =  jsFolder + '/**/*.js';
    var combinedJsFile = 'code.min.js';
    var rootFolders = ['fonts','i18n','vendor','img'];
    var rootFiles = [
        'crossdomain.xml',
        'favicon.ico',
        'humans.txt',
        'LICENSE',
        'package.json',
        'params.json',
        'README.md',
        'robots.txt'
    ] ;
    (function () {
        var i = rootFiles.length;
        while (i--) {
            rootFiles[i] = ''.concat(root,'/',rootFiles[i]);
        }
    })();


    function onError (err) {
        if (err) {
            throw err;
        }
    }

    gulp.task('render-less', ['create-folders'], function () {
        gulp.src(allLessFiles)
            .pipe(less({plugins : [autoprefix]}))
            .pipe(gulp.dest(cssDevDeployFolder));

        return gulp.src(allLessFiles).pipe(concat(combinedCssFile)).pipe(less({plugins : [cleancss, autoprefix]})).pipe(gulp.dest(rootDeploy));
    });

    gulp.task('render-js', function () {
        return gulpMerge(
            gulp.src(allJsFiles)
                .pipe(gulp.dest(jsDevDeployFolder))
                .pipe(uglify())
        )
            .pipe(concat(combinedJsFile))
            .pipe(gulp.dest(rootDeploy));
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

    function mergeTemplates () {
        var templates = getFileList(templatesFolder);
        var templateCount = templates.length;
        var accString = "";
        var contentPattern = new RegExp(/<body>((.|\n)*?)<\/body>/m);
        while (templateCount--) {
            var fileName = templates[templateCount];
            if (fileName.indexOf('.template.html') > -1) {
                var file = fs.readFileSync(templatesFolder + '/'+fileName, 'utf-8');
                var content = file.match(contentPattern);
                accString += content[1];
            }
        }

        fs.readFile ('./templates/templates.src.html', 'utf-8', function (err, template) {
            var content = template.replace('{{templates}}',accString);
            fs.writeFile(rootDevDeploy.concat('/templates.html'), content, onError);
            fs.writeFile(rootDeploy.concat('/templates.html'), content, onError);
        });
    }

    function renderIndex () {
        fs.readFile ('./templates/index.src.html', 'utf-8', function (err, template) {
            var data = {
                prod: {
                    stylesheets:{ stylesheet: [ combinedCssFile ] },
                    scripts: { script: [ combinedJsFile ] },
                    environment : 'prod'
                },
                dev: {
                    stylesheets:{stylesheet: getFileList (cssDevDeployFolder, cssUrl + '/')  },
                    scripts: { script: getFileList (jsFolder, jsUrl + '/') },
                    environment : 'debug'
                }
            };

            var rendered = TPL.render (template, data.dev);
            fs.writeFile(rootDevDeploy.concat('/index.html'), rendered, onError);
            fs.writeFile(rootDevDeploy.concat('/404.html'), rendered, onError);

            rendered = TPL.render (template, data.prod);
            fs.writeFile(rootDeploy.concat('/index.html'), rendered,onError);
            fs.writeFile(rootDeploy.concat('/404.html'), rendered,onError);
        });
    }

    gulp.task('render-index', function createIndexTask () {
        TPL.setLocale(params.language);
        TPL.loadLanguage(root.concat(i18nFolder, '/', params.language , '.json'));

        mergeTemplates();
        renderIndex();
    });

    gulp.task('create-folders',function createFolders () {
        var folders = [rootDeploy, rootDevDeploy, cssDevDeployFolder].reverse();
        var i = folders.length;
        while (i--) {
            var folder = folders[i];
            if (!fs.existsSync(folder)){
                fs.mkdirSync(folder);
            }
        }
    });

    gulp.task('copy-root',function createFolders () {
        gulp.src(rootFiles).pipe(gulp.dest(rootDevDeploy)).pipe(gulp.dest(rootDeploy));
        var i = rootFolders.length;
        while (i--) {
            var folder = rootFolders[i];
            gulp.src([''.concat(root,'/',folder,'/**/*')]).pipe(gulp.dest(''.concat(rootDevDeploy,'/',folder))).pipe(gulp.dest(''.concat(rootDeploy,'/',folder)));
        }
    });

    function watchTask () {
        gulp.watch([allJsFiles], ['render-js']);
        gulp.watch([allLessFiles], ['render-less']);
        gulp.watch([allTemplatesFiles], ['render-index']);

        var i = rootFolders.length;
        var folders = [];
        while (i--) {
            folders[i] = ''.concat(root,'/',rootFolders[i],'/**/*');
        }
        gulp.watch(folders, ['copy-root']);
    }

    gulp.task('watch', watchTask);

    gulp.task('default', ['create-folders','copy-root','render-js','render-less','render-index'], function () {
        console.log('started watching...');
        watchTask ();
    });
})();