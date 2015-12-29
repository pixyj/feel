var gulp = require('gulp');

var minify = require('gulp-minify');
var minifyCss = require('gulp-minify-css');
var uglify = require('gulp-uglify');
var gutil = require('gulp-util');

var rename = require('gulp-rename');


gulp.task('default', function() {
    console.log("nothing to do here");
});

gulp.task('minify-css', function() {
  return gulp.src('dist/*.css')
    .pipe(minifyCss())
    .pipe(rename({
        'suffix': '.min'
    }))
    .pipe(gulp.dest('dist/min'));
});

gulp.task('minify-js', function() {
  gulp.src("dist/*.js")
    .pipe(minify().on('error', gutil.log))
    .pipe(gulp.dest('dist/min'))
});

gulp.task('minify', function() {
    gulp.start('minify-css', 'minify-js');
});
