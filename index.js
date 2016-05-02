(function serveEncolusre() {
  var fs = require('fs');
  var less = require('less');
  var deasync = require('deasync');
  var UglifyJS = require("uglify-js"); //https://www.npmjs.com/package/uglify-js
  var chokidar = require('chokidar');
  var staticServer = require('node-static');

  var TPL = require ('./vendor/o.min.js');
  var color = require ('./etc/console-colour.js');

  //////////////////////////////////////////////////////////////// configuration
  // static server will run on port
  var isDebug = true; // if true server will run from devFolder
  var port = 8080;
  var packageJson = require ('./package.json'); // used to take app.name+ ver

  var debugServer = 'http://localhost:5000/';
  var productionServer = 'https://theo-dorus.rhcloud.com/';

  // two version will be built - develop and minimised production
  var prdFolder = '_deploy.prd';
  var devFolder = '_deploy.dev';
  // These folders need to pre created in order to be later populated
  var folderStructure = {};
  folderStructure[prdFolder] = { 'css' : {}, 'js' : {} };
  folderStructure[devFolder] = { 'css' : {}, 'js' : {} };
  // Folders that should be automatically copied whenever changed
  var watchFolders = ['./fonts','./i18n','./vendor','./img'];
  // files that should be initially copied (once) to the output
  var staticFiles = [
      'fonts','i18n','vendor','img',
      { src : 'static', isFlat: true }, //copy folder content but not the folder itself
      'LICENSE',
      'package.json',
      'params.json',
      'README.md'
  ];
  // location of files:
  var stylesheetFolder = 'less';
  var jsFolder = 'js';
  var templatesFolder = 'templates';
  var cssFolder = 'css';
  var combinedJsFile = 'code.min.js';
  var combinedCssFile = 'stylesheet.min.css';
  var indexHtmlSourceFile = './templates/index.src.html';

  ////////////////////////////////////////////////////////////// utils functions

  function getFormattedTime (time) {
    return time.getHours()+':'+time.getMinutes()+':'+time.getSeconds();
  }
  function timed (method) {
    var time = new Date();
    var methodName = method.name.replace(/bound /g,'');
    console.log(''.concat('[',color.blue,getFormattedTime(time),color.reset,'] starting ',color.cyan,methodName,color.reset,'...'));
    method();
    console.log(''.concat('[',color.blue,getFormattedTime(time),color.reset,'] finished ',color.cyan,methodName,' (',color.green,(Date.now()-time.getTime())/1000,'s',color.reset,')',color.reset));
  }

  function deleteFolderRecursive (path) {
    if( fs.existsSync(path) ) {
      if(fs.lstatSync(path).isDirectory()) { // recurse
        var files = fs.readdirSync(path);
        while (files.length) {
          var file = files.pop();
          deleteFolderRecursive(path + "/" + file);
        }
        fs.rmdirSync(path);
      } else { // delete file
        fs.unlinkSync(path);
      }
    }
  }

  function getFileList (folder, mask) {
    var files = fs.readdirSync(folder);
    var output = [];
    if (mask === undefined) {
      mask = '';
    }
    while (files.length) {
      var curPath = folder + '/' + files.pop();
      if(fs.lstatSync(curPath).isDirectory()) {
        output.splice(output.length,0,getFileList(curPath,mask));
      } else {
        output[output.length] = curPath.replace(mask,'');
      }
    }
    return output;
  }

  function copyFile (source, target) {
    fs.writeFileSync(target, fs.readFileSync(source));
  }

  /////////////////////////////////////////////////////////////// main functions
  function clearFolderStructure (root) {
    var folders = Object.keys(root);
    while (folders.length) {
        var folder = folders.pop();
        if( fs.existsSync(folder) ) {
          var files = getFileList(folder);
          while (files.length) {
            deleteFolderRecursive (folder + '/' + files.pop());
          }
        }
    }
  }

  function buildFolderStructure (root,parent) {
    if (parent === undefined) {
      parent = '';
    }
    var folders = Object.keys(root);
    while (folders.length) {
        var folder = folders.pop();
        if (!fs.existsSync(parent + folder)){
            fs.mkdirSync(parent + folder);
        }
        buildFolderStructure(root[folder], folder+'/');
    }
  }

  function copyStaticFiles (files, targets, isFlat) {
    var count = files.length;
    while (count--) {
      var file = files[count], flatten = isFlat;
      if (typeof file === 'object' && !Array.isArray(file)) {
        flatten = file.isFlat;
        file = file.src;
      } else {
        file = files[count];
      }
      if (fs.existsSync(file)){
        var targetCount = targets.length;
        while (targetCount--) {
          var target = targets[targetCount];
          if(fs.lstatSync(file).isDirectory()) {
            if (!flatten && !fs.existsSync(target+'/'+file)) {
              fs.mkdirSync(target+'/'+file);
            }
            copyStaticFiles (getFileList(file), [ target ], flatten);
          } else {
            var destination = isFlat ? file.substr(file.lastIndexOf('/')+1) : file;
            copyFile(file, target +'/'+destination);
          }
        }
      } else {
        console.log('file not found for copy: '+ file);
      }
    }
  }

  //------------------------------------------------------------------------- js

  function copyJavascript (source, target) {
    var files = fs.readdirSync(source);
    while (files.length) {
      var file = files.pop();
      var curPath = source + "/" + file;
      if(fs.lstatSync(curPath).isDirectory()) {
        copyJavascript (curPath, target);
      } else {
        copyFile (curPath, target + '/'+ file);
      }
    }
  }

  function processJavascripts () {
    var jsDevFolder = devFolder.concat('/',jsFolder);
    copyJavascript (jsFolder, jsDevFolder);
    var files = getFileList(jsDevFolder);
    try {
      fs.writeFileSync(prdFolder.concat('/',jsFolder,'/',combinedJsFile),
                       UglifyJS.minify(files).code, 'utf8' );
    }
    catch (err) {
      console.log('failed to uglify:',err);
    }

  }

  //------------------------------------------------------------------------ css

  function onStylesheetRendered (target, outputs, err, output) {
    if (err) {
      console.log('failed to render stylesheet ' + target);
      console.log(err);
    } else {
      fs.writeFileSync(target.replace('.less','.css'), output.css, 'utf8' );
      outputs[outputs.length] = output.css;
    }
  }

  function processStylesheets () {
    var files = getFileList(stylesheetFolder);
    var fileCount = files.length;
    var outputs = [];
    while (files.length) {
      var fileName = files.pop();
      var target = devFolder
                    .concat('/', cssFolder, fileName.substr(fileName.lastIndexOf('/')));
      less.render( fs.readFileSync(fileName,'utf-8') ,
      {
        paths: ['stylesheetFolder'],  // Specify search paths for @import directives
        filename: fileName, // Specify a filename, for better error messages
        compress: true          // Minify CSS output
      },
      onStylesheetRendered.bind({}, target, outputs));
    }
    deasync.loopWhile(function(){return (outputs.length < fileCount);});
    fs.writeFileSync(prdFolder
                      .concat('/', cssFolder, '/', combinedCssFile), outputs.join(''), 'utf8' );
  }

  function onError (err) {
      if (err) {
          throw err;
      }
  }

  //------------------------------------------------------------------ templates

  function mergeTemplates () {
    var templates = getFileList(templatesFolder);
    var templateCount = templates.length;
    var accString = "";
    var contentPattern = new RegExp(/<body>((.|\n)*?)<\/body>/m);
    while (templateCount--) {
        var fileName = templates[templateCount];
        if (fileName.indexOf('.template.html') > -1) {
            var file = fs.readFileSync( fileName, 'utf-8');
            var content = file.match(contentPattern);
            accString += content[1];
        }
    }

    fs.readFile ('./templates/templates.src.html', 'utf-8', function (err, template) {
        var content = template.replace('{{templates}}',accString);
        fs.writeFile(prdFolder.concat('/templates.html'), content, onError);
        fs.writeFile(devFolder.concat('/templates.html'), content, onError);
    });
  }

  //----------------------------------------------------------------- index.html

  function buildIndexHtml () {
    var indexHTML = fs.readFileSync(indexHtmlSourceFile, 'utf-8');
    var data = {
        prod: {
            stylesheets:{ stylesheet: getFileList ( prdFolder.concat('/',cssFolder), prdFolder+'/' ) },
            scripts: { script: getFileList ( prdFolder.concat('/',jsFolder), prdFolder+'/' ) },
            environment : 'prod',
            server : productionServer
        },
        dev: {
            stylesheets: { stylesheet: getFileList ( devFolder.concat('/',cssFolder), devFolder+'/' )  },
            scripts: { script: getFileList ( devFolder.concat('/',jsFolder), devFolder+'/' ) },
            environment : 'debug',
            server : debugServer
        }
    };
    TPL.loadLanguage('../i18n/en-us.json');

    var rendered = TPL.render (indexHTML, data.dev);
    fs.writeFile(devFolder.concat('/index.html'), rendered, onError);
    fs.writeFile(devFolder.concat('/404.html'), rendered, onError);

    rendered = TPL.render (indexHTML, data.prod);
    fs.writeFile(prdFolder.concat('/index.html'), rendered,onError);
    fs.writeFile(prdFolder.concat('/404.html'), rendered,onError);
  }

  //---------------------------------------------------------------------- build
  function build () {
    clearFolderStructure (folderStructure);
    buildFolderStructure (folderStructure);
    copyStaticFiles (staticFiles, Object.keys(folderStructure));
    processStylesheets ();
    processJavascripts ();
    mergeTemplates ();
    buildIndexHtml ();
  }

  function rebuildJavascripts () {
    processJavascripts ();
    buildIndexHtml ();
  }

  function rebuildStylesheets () {
    processStylesheets ();
    buildIndexHtml ();
  }

  function dynamicFolderUpdated (updatedFile) {
    copyStaticFiles([updatedFile], Object.keys(folderStructure));
  }

  //-------------------------------------------------------------------- watches

  function logWatch (verb, method, target) {
    console.log (''.concat (' - ',target,' ',color.yellow,verb,color.reset));
    timed(method.bind({},target));
  }

  function watchesInit () {
    var options = { ignoreInitial: true }; //don't run when adding the watches
    chokidar.watch(indexHtmlSourceFile).on('change', logWatch.bind ({},'changed',dynamicFolderUpdated));
    chokidar.watch('./'+jsFolder, options)
      .on('change', logWatch.bind ({}, 'changed', processJavascripts))
      .on('add',logWatch.bind ({}, 'added', rebuildJavascripts))
      .on('unlink',logWatch.bind ({}, 'removed', rebuildJavascripts));
    chokidar.watch('./'+stylesheetFolder, options)
      .on('change', logWatch.bind ({}, 'changed', processStylesheets))
      .on('add', logWatch.bind ({}, 'added', rebuildStylesheets))
      .on('unlink', logWatch.bind ({}, 'removed', rebuildStylesheets));
    chokidar.watch('./'+templatesFolder, options)
      .on('change', logWatch.bind ({}, 'changed', mergeTemplates))
      .on('add', logWatch.bind ({}, 'added', mergeTemplates))
      .on('unlink', logWatch.bind ({}, 'removed', mergeTemplates));
    chokidar.watch(watchFolders, options)
      .on('change', logWatch.bind ({}, 'changed', dynamicFolderUpdated))
      .on('add', logWatch.bind ({}, 'added', dynamicFolderUpdated))
      .on('unlink', logWatch.bind ({}, 'removed', dynamicFolderUpdated));
  }

  //--------------------------------------------------------------------- server
  function serverInit () {
    var fileServer = new staticServer.Server('./' + (isDebug ? devFolder : prdFolder));

    require('http').createServer(function (request, response) {
      request.addListener('end', function () {
        fileServer.serve(request, response, function (err, result) {
          if (err) { // There was an error serving the file
            console.error("Error serving " + request.url + " - " + err.message);
            response.writeHead(err.status, err.headers);
            response.end();
          }
        });
      }).resume();
    }).listen(port);
  }

  ////////////////////////////////////////////////////////////////////////// run
  timed(build);
  timed(serverInit);
  timed(watchesInit);
  console.log(''.concat(color.bgBlue,color.white,'##### '+packageJson.name+' (v'+packageJson.version+') now running ....                                    #####',color.reset));
})();
