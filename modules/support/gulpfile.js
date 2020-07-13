const gulp = require('gulp');
const concat = require('gulp-concat');
const minifyCSS = require('gulp-clean-css');
const uglify = require('gulp-uglify');
const babel = require('gulp-babel');
const fs = require('fs');
const path = require('path');

gulp.task('cleanup', async() => {
    fs.unlinkSync(`${__dirname}/static/css/backend.min.css`);
    fs.unlinkSync(`${__dirname}/static/css/frontend.min.css`);
    fs.unlinkSync(`${__dirname}/static/js/backend.min.js`);
    fs.unlinkSync(`${__dirname}/static/js/frontend.min.js`);
});

gulp.task('default', async() => {
    // Generate CSS
    gulp.src(['static/css/frontend.css'], { base: __dirname })
        .pipe(minifyCSS())
        .pipe(concat('frontend.min.css'))
        .pipe(gulp.dest(path.join('static', 'css')));
    gulp.src(['static/css/backend.css'], { base: __dirname })
        .pipe(minifyCSS())
        .pipe(concat('backend.min.css'))
        .pipe(gulp.dest(path.join('static', 'css')));
    // Generate backend.min.js
    await new Promise((resolve) => {
        gulp.src(['../../static/zoia/core/js/jquery.zoiaFormBuilder.js', '../../static/zoia/core/js/jquery.zoiaTable.js', 'static/js/backend.js'], { base: __dirname })
            .pipe(babel({
                presets: ['env']
            }))
            .pipe(concat('backend.min.js'))
            .pipe(uglify())
            .pipe(gulp.dest(path.join('static', 'js')))
            .on('end', resolve);
    });
    // Generate frontend.min.js
    await new Promise((resolve) => {
        gulp.src(['../../static/zoia/core/js/jquery.zoiaTable.js', 'static/js/frontend.js'], { base: __dirname })
            .pipe(babel({
                presets: ['env']
            }))
            .pipe(concat('frontend.min.js'))
            .pipe(uglify())
            .pipe(gulp.dest(path.join('static', 'js')))
            .on('end', resolve);
    });
});