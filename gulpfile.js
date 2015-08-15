var gulp = require('gulp');
var bower = require('gulp-bower');
var less = require('gulp-less');
var mainBowerFiles = require('main-bower-files');
var source = require('vinyl-source-stream');
var browserify = require('browserify');
var reactify = require('reactify');

gulp.task('default', ['build']);
gulp.task('build', ['app', 'styles'], function() {
  return gulp.src('src/app.html')
    .pipe(gulp.dest('ui/'));
});

gulp.task('app', function() {
  return browserify({
      entries: ['./src/js/main.js'],
      transform: [reactify]
    })
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
