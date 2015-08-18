var gulp = require('gulp');
var bower = require('gulp-bower');
var less = require('gulp-less');
var mainBowerFiles = require('main-bower-files');
var source = require('vinyl-source-stream');
var browserify = require('browserify');
var reactify = require('reactify');
var preprocessify = require('preprocessify');
var packager = require('electron-packager')

gulp.task('default', ['build']);
gulp.task('build', ['app', 'styles'], function() {
  return gulp.src('src/app.html')
    .pipe(gulp.dest('ui/'));
});

gulp.task('app', function() {
  return browserify('./src/js/main.js')
    .transform(preprocessify({'PICKER_URL': require('./package.json').pickerUrl}))
    .transform(reactify)
    .bundle()
    .pipe(source('app.js'))
    .pipe(gulp.dest('ui/'));
})

gulp.task('styles', ['bower', 'fonts'], function() {
  return gulp.src('src/styles.less')
    .pipe(less())
    .pipe(gulp.dest('ui/'));
});

gulp.task('fonts', ['bower'], function() {
  return gulp.src(mainBowerFiles('**/fonts/**'))
    .pipe(gulp.dest('ui/fonts'));
});

gulp.task('bower', function() {
  return bower();
});

gulp.task('package', function(done) {
  packager({
    dir: './',
    out: './builds',
    name: 'Musicpicker',
    platform: 'win32',
    arch: 'x64',
    version: '0.30.1',
    asar: true,
    prune: true,
    icon: 'musicpicker.ico',
    'version-string': {
      ProductName: 'Musicpicker',
      CompanyName: 'Musicpicker',
      FileDescription: 'Musicpicker'
    },
    ignore: [
      '/bower_components($|/)',
      '/builds($|/)',
      '/src($|/)',
      '/node_modules/electron-prebuilt($|/)',
      '/node_modules/electron-packager($|/)',
      'musicpicker.db',
      '/\.git($|/)'
    ]
  }, function(err, appPath) {
    done();
  });
});