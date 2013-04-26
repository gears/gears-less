var path   = require('path'),
    less   = require('less'),
    source = '';

function error(err, filename) {
  err.filename = filename;
  less.writeError(err);
  process.exit(1);
}

process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', function(chunk) {
  source += chunk;
});

process.stdin.on('end', function() {
  var filename = process.argv[2],
      parser   = new(less.Parser)({paths: [path.dirname(filename)]});
  try {
    parser.parse(source, function(err, tree) {
      if (err) {
        error(err, filename);
      }
      process.stdout.write(tree.toCSS());
    });
  } catch (err) {
    error(err, filename);
  }
});
