const gulp = require('gulp');
const concat = require('gulp-concat');
const minifyCSS = require('gulp-clean-css');
const uglify = require('gulp-uglify');
const babel = require('gulp-babel');
const fs = require('fs');
const path = require('path');

gulp.task('cleanup', async() => {
    fs.unlinkSync('static/css/warehouse.min.css');
    fs.unlinkSync('static/css/browse.min.css');
    fs.unlinkSync('static/css/catalog.min.css');
    fs.unlinkSync('static/css/catalog_cart.min.css');
    fs.unlinkSync('static/css/catalog_item.min.css');
    fs.unlinkSync('static/css/catalog_order.min.css');
    fs.unlinkSync('static/css/catalog_orders.min.css');
    fs.unlinkSync('static/js/warehouse.min.js');
    fs.unlinkSync('static/js/browse.min.js');
    fs.unlinkSync('static/js/catalog.min.js');
    fs.unlinkSync('static/js/catalog_cart.min.js');
    fs.unlinkSync('static/js/catalog_item.min.js');
    fs.unlinkSync('static/js/catalog_order.min.js');
    fs.unlinkSync('static/js/catalog_orders.min.js');
});

gulp.task('default', async() => {
    // Generate CSS
    gulp.src(['../../static/zoia/3rdparty/jstree/themes/default/style.min.css', 'static/css/warehouse.css'], { base: __dirname })
        .pipe(minifyCSS())
        .pipe(concat('warehouse.min.css'))
        .pipe(gulp.dest(`static/css`));
    gulp.src(['../../static/zoia/3rdparty/uikit/css/uikit.min.css', 'static/css/browse.css'], { base: __dirname })
        .pipe(minifyCSS())
        .pipe(concat('browse.min.css'))
        .pipe(gulp.dest(`static/css`));
    gulp.src(['static/css/catalog.css'], { base: __dirname })
        .pipe(minifyCSS())
        .pipe(concat('catalog.min.css'))
        .pipe(gulp.dest(`static/css`));
    gulp.src(['static/css/catalog_cart.css'], { base: __dirname })
        .pipe(minifyCSS())
        .pipe(concat('catalog_cart.min.css'))
        .pipe(gulp.dest(`static/css`));
    gulp.src(['static/css/catalog_item.css'], { base: __dirname })
        .pipe(minifyCSS())
        .pipe(concat('catalog_item.min.css'))
        .pipe(gulp.dest(`static/css`));
    gulp.src(['static/css/catalog_order.css'], { base: __dirname })
        .pipe(minifyCSS())
        .pipe(concat('catalog_order.min.css'))
        .pipe(gulp.dest(`static/css`));
    gulp.src(['static/css/catalog_orders.css'], { base: __dirname })
        .pipe(minifyCSS())
        .pipe(concat('catalog_orders.min.css'))
        .pipe(gulp.dest(`static/css`));
    // Generate browse.min.js
    await new Promise((resolve) => {
        gulp.src(['../../static/zoia/3rdparty/jquery/jquery.shifty.min.js', '../../static/zoia/3rdparty/jquery/jquery.finger.min.js', '../../static/zoia/3rdparty/plupload/plupload.min.js'], { base: __dirname })
            .pipe(concat('plugins'))
            .pipe(gulp.dest(`static/js`))
            .on('end', resolve);
    });
    await new Promise((resolve) => {
        gulp.src(['static/js/browse.js'], { base: __dirname })
            .pipe(babel({
                presets: ['env']
            }))
            .pipe(concat('browse'))
            .pipe(uglify())
            .pipe(gulp.dest(`static/js`))
            .on('end', resolve);
    });
    await new Promise((resolve) => {
        gulp.src(['../../static/zoia/3rdparty/uikit/js/bundle.min.js', 'static/js/plugins', 'static/js/browse'], { base: __dirname })
            .pipe(concat('browse.min.js'))
            .pipe(gulp.dest(`static/js`))
            .on('end', resolve);
    });
    fs.unlinkSync(path.join(__dirname, 'static', 'js', 'browse'));
    fs.unlinkSync(path.join(__dirname, 'static', 'js', 'plugins'));
    // Generate warehouse.min.js
    await new Promise((resolve) => {
        gulp.src(['../../static/zoia/3rdparty/jquery/jquery.shifty.min.js', '../../static/zoia/3rdparty/plupload/plupload.min.js'], { base: __dirname })
            .pipe(concat('plugins'))
            .pipe(gulp.dest(`static/js`))
            .on('end', resolve);
    });
    await new Promise((resolve) => {
        gulp.src(['../../static/zoia/core/js/jquery.zoiaFormBuilder.js', '../../static/zoia/core/js/jquery.zoiaTable.js', 'static/js/warehouse.js'], { base: __dirname })
            .pipe(babel({
                presets: ['env']
            }))
            .pipe(concat('warehouse'))
            .pipe(uglify())
            .pipe(gulp.dest(`static/js`))
            .on('end', resolve);
    });
    await new Promise((resolve) => {
        gulp.src(['../../static/zoia/3rdparty/jstree/jstree.min.js', 'static/js/plugins', 'static/js/warehouse'], { base: __dirname })
            .pipe(concat('warehouse.min.js'))
            .pipe(gulp.dest(`static/js`))
            .on('end', resolve);
    });
    fs.unlinkSync(path.join(__dirname, 'static', 'js', 'warehouse'));
    fs.unlinkSync(path.join(__dirname, 'static', 'js', 'plugins'));
    // Generate catalog.min.js
    await new Promise((resolve) => {
        gulp.src(['static/js/catalog.js'], { base: __dirname })
            .pipe(babel({
                presets: ['env']
            }))
            .pipe(concat('catalog.min.js'))
            .pipe(uglify())
            .pipe(gulp.dest(`static/js`))
            .on('end', resolve);
    });
    // Generate catalog_cart.min.js
    await new Promise((resolve) => {
        gulp.src(['static/js/catalog_cart.js'], { base: __dirname })
            .pipe(babel({
                presets: ['env']
            }))
            .pipe(concat('catalog_cart.min.js'))
            .pipe(uglify())
            .pipe(gulp.dest(`static/js`))
            .on('end', resolve);
    });
    // Generate catalog_item.min.js
    await new Promise((resolve) => {
        gulp.src(['static/js/catalog_item.js'], { base: __dirname })
            .pipe(babel({
                presets: ['env']
            }))
            .pipe(concat('catalog_item.min.js'))
            .pipe(uglify())
            .pipe(gulp.dest(`static/js`))
            .on('end', resolve);
    });
    // Generate catalog_order.min.js
    await new Promise((resolve) => {
        gulp.src(['static/js/catalog_order.js'], { base: __dirname })
            .pipe(babel({
                presets: ['env']
            }))
            .pipe(concat('catalog_order.min.js'))
            .pipe(uglify())
            .pipe(gulp.dest(`static/js`))
            .on('end', resolve);
    });
    // Generate catalog_orders.min.js
    await new Promise((resolve) => {
        gulp.src(['../../static/zoia/core/js/jquery.zoiaTable.js', 'static/js/catalog_orders.js'], { base: __dirname })
            .pipe(babel({
                presets: ['env']
            }))
            .pipe(concat('catalog_orders.min.js'))
            .pipe(uglify())
            .pipe(gulp.dest(`static/js`))
            .on('end', resolve);
    });
});