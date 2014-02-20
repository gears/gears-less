var path   = require('path'),
    url    = require('url'),
    fs     = require('fs'),
    domain = require('domain'),
    less   = require('less'),

    source     = '',
    filename   = process.argv[2],
    gearsPaths = process.argv.slice(3);

process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', function(chunk) {
  source += chunk;
});

process.stdin.on('end', function() {
  var d = domain.create();

  d.on('error', function(err) {
    err.filename = filename;
    less.writeError(err);
    process.exit(1);
  });

  d.run(function() {
    var parser = new less.Parser({
      paths: [],
      filename: filename,
      relativeUrls: true
    });
    parser.parse(source, function(err, tree) {
      if (err) throw err;
      process.stdout.write(tree.toCSS());
    });
  });
});

var isUrlRe = /^(?:https?:)?\/\//i;

less.Parser.fileLoader = function(file, currentFileInfo, callback, env) {
  var pathname, dirname, data,
      newFileInfo = {
        relativeUrls: env.relativeUrls,
        entryPath: currentFileInfo.entryPath,
        rootpath: currentFileInfo.rootpath,
        rootFilename: currentFileInfo.rootFilename
      };

  function handleDataAndCallCallback(pathname, data) {
    var j = file.lastIndexOf('/');

    // Pass on an updated rootpath if path of imported file is relative and file 
    // is in a (sub|sup) directory
    // 
    // Examples: 
    // - If path of imported file is 'module/nav/nav.less' and rootpath is 'less/',
    //   then rootpath should become 'less/module/nav/'
    // - If path of imported file is '../mixins.less' and rootpath is 'less/', 
    //   then rootpath should become 'less/../'
    if (newFileInfo.relativeUrls && !/^(?:[a-z-]+:|\/)/.test(file) && j != -1) {
      var relativeSubDirectory = file.slice(0, j+1);
      newFileInfo.rootpath = newFileInfo.rootpath + relativeSubDirectory; // append (sub|sup) directory path of imported file
    }
    newFileInfo.currentDirectory = pathname.replace(/[^\\\/]*$/, "");
    newFileInfo.filename = pathname;

    callback(null, data, pathname, newFileInfo);
  }

  var isUrl = isUrlRe.test( file );
  if (isUrl || isUrlRe.test(currentFileInfo.currentDirectory)) {
    if (request === undefined) {
      try { request = require('request'); }
      catch(e) { request = null; }
    }
    if (!request) {
      callback({ type: 'File', message: "optional dependency 'request' required to import over http(s)\n" });
      return;
    }

    var urlStr = isUrl ? file : url.resolve(currentFileInfo.currentDirectory, file),
        urlObj = url.parse(urlStr);

    request.get({uri: urlStr, strictSSL: !env.insecure }, function (error, res, body) {
      if (res.statusCode === 404) {
        callback({ type: 'File', message: "resource '" + urlStr + "' was not found\n" });
        return;
      }
      if (!body) {
        console.error( 'Warning: Empty body (HTTP '+ res.statusCode + ') returned by "' + urlStr +'"' );
      }
      if (error) {
        callback({ type: 'File', message: "resource '" + urlStr + "' gave this Error:\n  "+ error +"\n" });
      }
      pathname = urlStr;
      dirname = urlObj.protocol +'//'+ urlObj.host + urlObj.pathname.replace(/[^\/]*$/, '');
      handleDataAndCallCallback(pathname, body);
    });
  } else {

    var paths = gearsPaths.map(function(gearsPath) {
      return path.join(gearsPath, currentFileInfo.currentDirectory);
    });

    if (env.syncImport) {
      for (var i = 0; i < paths.length; i++) {
        try {
          pathname = path.join(paths[i], file);
          fs.statSync(pathname);
          break;
        } catch (e) {
          pathname = null;
        }
      }

      if (!pathname) {
        callback({ type: 'File', message: "'" + file + "' wasn't found" });
        return;
      }

      try {
        data = fs.readFileSync(pathname, 'utf-8');
        pathname = path.join(currentFileInfo.currentDirectory, file);
        handleDataAndCallCallback(pathname, data);
      } catch (e) {
        callback(e);
      }
    } else {
      (function tryPathIndex(i) {
        if (i < paths.length) {
          pathname = path.join(paths[i], file);
          fs.stat(pathname, function (err) {
            if (err) {
              tryPathIndex(i + 1);
            } else {
              fs.readFile(pathname, 'utf-8', function(e, data) {
                if (e) { callback(e); }
                pathname = path.join(currentFileInfo.currentDirectory, file);
                handleDataAndCallCallback(pathname, data);
              });
            }
          });
        } else {
          callback({ type: 'File', message: "'" + file + "' wasn't found" });
        }
      }(0));
    }
  }
};
