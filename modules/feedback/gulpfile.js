const gulp = require('gulp');
const concat = require('gulp-concat');
const minifyCSS = require('gulp-clean-css');
const fs = require('fs');
const path = require('path');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');

gulp.task('cleanup', async() => {
    fs.unlinkSync(path.join(__dirname, 'static', 'css', 'frontend.min.css'));
    fs.unlinkSync(path.join(__dirname, 'static', 'js', 'frontend.min.js'));
});

gulp.task('default', async() => {
    // Generate CSS
    gulp.src(['static/css/frontend.css'], { base: __dirname })
        .pipe(minifyCSS())
        .pipe(concat('frontend.min.css'))
        .pipe(gulp.dest('./static/css'));
    // Generate JS
    await new Promise((resolve) => {
        gulp.src(['../../static/zoia/core/js/jquery.zoiaFormBuilder.js', 'static/js/frontend.js'], { base: __dirname })
            .pipe(babel({
                presets: ['env']
            }))
            .pipe(concat('frontend.min.js'))
            .pipe(uglify())
            .pipe(gulp.dest(path.join('static', 'js')))
            .on('end', resolve);
    });
});