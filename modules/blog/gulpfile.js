const gulp = require('gulp');
const concat = require('gulp-concat');
const minifyCSS = require('gulp-clean-css');
const uglify = require('gulp-uglify');
const babel = require('gulp-babel');
const fs = require('fs');
const path = require('path');

gulp.task('cleanup', async() => {
    fs.unlinkSync(path.join(__dirname, 'static', 'css', 'blog.min.css'));
    fs.unlinkSync(path.join(__dirname, 'static', 'css', 'frontend.min.css'));
    fs.unlinkSync(path.join(__dirname, 'static', 'js', 'blog.min.js'));
    fs.unlinkSync(path.join(__dirname, 'static', 'js', 'frontend_item.min.js'));
});

gulp.task('default', async() => {
    // Generate CSS
    gulp.src(['static/css/frontend.css'], { base: __dirname })
        .pipe(minifyCSS())
        .pipe(concat('frontend.min.css'))
        .pipe(gulp.dest(path.join('static', 'css')));
    gulp.src(['static/css/blog.css'], { base: __dirname })
        .pipe(minifyCSS())
        .pipe(concat('blog.min.css'))
        .pipe(gulp.dest(path.join('static', 'css')));
    // Generate blog.min.js
    await new Promise((resolve) => {
        gulp.src(['../../static/zoia/core/js/jquery.zoiaFormBuilder.js', '../../static/zoia/core/js/jquery.zoiaTable.js', 'static/js/tags-input.js', 'static/js/blog.js'], { base: __dirname })
            .pipe(babel({
                presets: ['env']
            }))
            .pipe(concat('blog'))
            .pipe(uglify())
            .pipe(gulp.dest(path.join('static', 'js')))
            .on('end', resolve);
    });
    await new Promise((resolve) => {
        gulp.src(['../../static/zoia/3rdparty/moment/moment-with-locales.min.js', 'static/js/blog'], { base: __dirname })
            .pipe(concat('blog.min.js'))
            .pipe(gulp.dest(path.join('static', 'js')))
            .on('end', resolve);
    });
    fs.unlinkSync(path.join(__dirname, 'static', 'js', 'blog'));
    // Generate frontend_item.min.js
    await new Promise((resolve) => {
        gulp.src(['static/js/frontend_item.js'], { base: __dirname })
            .pipe(babel({
                presets: ['env']
            }))
            .pipe(concat('frontend_item'))
            .pipe(uglify())
            .pipe(gulp.dest(path.join('static', 'js')))
            .on('end', resolve);
    });
    await new Promise((resolve) => {
        gulp.src(['../../static/zoia/3rdparty/moment/moment-with-locales.min.js', 'static/js/frontend_item'], { base: __dirname })
            .pipe(concat('frontend_item.min.js'))
            .pipe(gulp.dest(path.join('static', 'js')))
            .on('end', resolve);
    });
    fs.unlinkSync(path.join(__dirname, 'static', 'js', 'frontend_item'));
});