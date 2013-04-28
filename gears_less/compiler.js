var path   = require('path'),
    domain = require('domain'),
    less   = require('less'),
    source = '';

process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', function(chunk) {
  source += chunk;
});

process.stdin.on('end', function() {
  var filename = process.argv[2],
      d        = domain.create();

  d.on('error', function(err) {
    err.filename = filename;
    less.writeError(err);
    process.exit(1);
  });

  d.run(function() {
    var parser = new(less.Parser)({paths: [path.dirname(filename)]});
    parser.parse(source, function(err, tree) {
      if (err) throw err;
      process.stdout.write(tree.toCSS());
    });
  });
});
