const gulp = require('gulp');
const concat = require('gulp-concat');
const minifyCSS = require('gulp-clean-css');
const fs = require('fs');
const path = require('path');

gulp.task('cleanup', async() => {
    fs.unlinkSync(path.join(__dirname, 'static', 'css', 'frontend.min.css'));
    fs.unlinkSync(path.join(__dirname, 'static', 'css', 'frontend_item.min.css'));
});

gulp.task('default', async() => {
    // Generate CSS
    gulp.src(['static/css/frontend.css'], { base: __dirname })
        .pipe(minifyCSS())
        .pipe(concat('frontend.min.css'))
        .pipe(gulp.dest('./static/css'));
    gulp.src(['static/css/frontend_item.css'], { base: __dirname })
        .pipe(minifyCSS())
        .pipe(concat('frontend_item.min.css'))
        .pipe(gulp.dest('./static/css'));
});