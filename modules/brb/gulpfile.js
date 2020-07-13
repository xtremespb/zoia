const gulp = require('gulp');
const concat = require('gulp-concat');
const minifyCSS = require('gulp-clean-css');
const uglify = require('gulp-uglify');
const babel = require('gulp-babel');
const fs = require('fs');
const path = require('path');

gulp.task('cleanup', async() => {
    fs.unlinkSync(
        path.join(
            __dirname,
            'static',
            'css',
            'brb.min.css'
        )
    );
    fs.unlinkSync(
        path.join(__dirname, 'static', 'js', 'brb.min.js')
    );
});

gulp.task('default', async() => {
    // Generate CSS
    gulp
        .src(['static/css/brb.css'], { base: __dirname })
        .pipe(minifyCSS())
        .pipe(concat('brb.min.css'))
        .pipe(gulp.dest(path.join('static', 'css')));
    gulp
        .src(['static/css/frontend.css'], { base: __dirname })
        .pipe(minifyCSS())
        .pipe(concat('frontend.min.css'))
        .pipe(gulp.dest(path.join('static', 'css')));
    // Generate brb.min.js
    gulp
        .src(
            [
                '../../static/zoia/core/js/jquery.zoiaFormBuilder.js',
                '../../static/zoia/core/js/jquery.zoiaTable.js',
                'static/js/brb.js'
            ], { base: __dirname }
        )
        .pipe(
            babel({
                presets: ['env']
            })
        )
        .pipe(concat('brb.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest(path.join('static', 'js')));
    // Generate frontend.min.js
    gulp
        .src(['../../static/zoia/core/js/jquery.zoiaTable.js', 'static/js/frontend.js'], { base: __dirname })
        .pipe(
            babel({
                presets: ['env']
            })
        )
        .pipe(concat('frontend.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest(path.join('static', 'js')));
});