var spawn = require('child_process').spawn;

var gulp = require('gulp');
var clean = require('gulp-clean');


var minify = require('gulp-minify');
var minifyCss = require('gulp-minify-css');
var uglify = require('gulp-uglify');

var gutil = require('gulp-util');
var shell = require('gulp-shell');
var rename = require('gulp-rename');

var browserify = require('browserify');
var reactify = require('reactify');

/********************************************************************************
*   Support functions
*********************************************************************************/

var execute_shell_script = function(scriptCommand, args) {
    args = args || [];
    gutil.log('Executing ', scriptCommand)
    var child = spawn(scriptCommand, args, {cwd: process.cwd()}),
        stdout = '',
        stderr = '';

    child.stdout.setEncoding('utf8');

    child.stdout.on('data', function (data) {
        stdout += data;
        gutil.log(data);
    });

    child.stderr.setEncoding('utf8');
    child.stderr.on('data', function (data) {
        stderr += data;
        gutil.log(gutil.colors.red(data));
        gutil.beep();
    });

    child.on('close', function(code) {
        gutil.log("Exit code", code);
        if(code === 0) {
            gutil.log("★★★ ", scriptCommand, "  ★★★");
        }
        else {

            gutil.log(stderr);
        }
    });
}

/********************************************************************************
*   Minification tasks
*********************************************************************************/

//todo -> Remove source file from destination. gulp-clean ain't working
gulp.task('minify-css', function() {
  return gulp.src('dist/*.css')
    .pipe(minifyCss())
    .pipe(rename({
        'suffix': '-min'
    }))
    .pipe(gulp.dest('dist/min'))
});

gulp.task('minify-js', function() {
    gulp.src('dist/*.js')
    .pipe(minify().on('error', gutil.log))
    .pipe(gulp.dest('dist/min'))
});

gulp.task('minify', function() {
    gulp.start('minify-css', 'minify-js');
});

/********************************************************************************
*   Compass compile (SCSS to CSS) tasks
*********************************************************************************/

gulp.task('compass-compile-vendor', function() {
    execute_shell_script('./compass-compile-app.sh');
});

gulp.task('compass-compile-app', function() {
    execute_shell_script('./compass-compile-vendor.sh');
});

/********************************************************************************
*   Browserify tasks
*********************************************************************************/

gulp.task('browserify-vendor', function() {
    execute_shell_script('./browserify-vendor.sh');
});

gulp.task('browserify-app', function() {
    execute_shell_script('./browserify-app.sh');
});


/********************************************************************************
*   Dev setup tasks
*********************************************************************************/

gulp.task('dev-setup', function() {
    gulp.start('compass-compile-vendor', 'compass-compile-app', 'browserify-vendor', 'browserify-app');
});

/********************************************************************************
*   Prod setup tasks
*********************************************************************************/

gulp.task('prod-minify', function() {
    gulp.start('dev-setup', 'minify');
});

gulp.task('prod-create-index-file', function() {
    gulp.start('')
});


