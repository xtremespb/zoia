const gulp = require('gulp');
const concat = require('gulp-concat');
const minifyCSS = require('gulp-clean-css');
const uglify = require('gulp-uglify');
const babel = require('gulp-babel');
const fs = require('fs');
const path = require('path');

gulp.task('cleanup', async() => {
    fs.unlinkSync(
        path.join(__dirname, 'static', 'zoia', 'core', 'css', 'panel.min.css')
    );
    fs.unlinkSync(
        path.join(__dirname, 'static', 'zoia', 'core', 'js', 'panel.min.js')
    );
    fs.unlinkSync(
        path.join(
            __dirname,
            'modules',
            'users',
            'static',
            'css',
            'users.min.css'
        )
    );
    fs.unlinkSync(
        path.join(__dirname, 'modules', 'users', 'static', 'js', 'users.min.js')
    );
    fs.unlinkSync(
        path.join(
            __dirname,
            'modules',
            'users',
            'static',
            'css',
            'frontend.min.css'
        )
    );
    fs.unlinkSync(
        path.join(
            __dirname,
            'modules',
            'users',
            'static',
            'js',
            'frontend.min.js'
        )
    );
    fs.unlinkSync(
        path.join(
            __dirname,
            'modules',
            'groups',
            'static',
            'css',
            'groups.min.css'
        )
    );
    fs.unlinkSync(
        path.join(
            __dirname,
            'modules',
            'groups',
            'static',
            'js',
            'groups.min.js'
        )
    );
    fs.unlinkSync(
        path.join(
            __dirname,
            'modules',
            'auth',
            'static',
            'css',
            'login.min.css'
        )
    );
    fs.unlinkSync(
        path.join(
            __dirname,
            'modules',
            'auth',
            'static',
            'css',
            'register.min.css'
        )
    );
    fs.unlinkSync(
        path.join(
            __dirname,
            'modules',
            'auth',
            'static',
            'css',
            'resetConfirm.min.css'
        )
    );
    fs.unlinkSync(
        path.join(
            __dirname,
            'modules',
            'auth',
            'static',
            'css',
            'reset.min.css'
        )
    );
    fs.unlinkSync(
        path.join(
            __dirname,
            'modules',
            'auth',
            'static',
            'css',
            'registerConfirm.min.css'
        )
    );
    fs.unlinkSync(
        path.join(
            __dirname,
            'static',
            'zoia',
            '3rdparty',
            'uikit',
            'js',
            'bundle.min.js'
        )
    );
    fs.unlinkSync(
        path.join(__dirname, 'modules', 'auth', 'static', 'js', 'login.min.js')
    );
    fs.unlinkSync(
        path.join(
            __dirname,
            'modules',
            'auth',
            'static',
            'js',
            'register.min.js'
        )
    );
    fs.unlinkSync(
        path.join(
            __dirname,
            'modules',
            'auth',
            'static',
            'js',
            'registerConfirm.min.js'
        )
    );
    fs.unlinkSync(
        path.join(__dirname, 'modules', 'auth', 'static', 'js', 'reset.min.js')
    );
    fs.unlinkSync(
        path.join(
            __dirname,
            'modules',
            'auth',
            'static',
            'js',
            'resetConfirm.min.js'
        )
    );
    fs.unlinkSync(
        path.join(
            __dirname,
            'modules',
            'pages',
            'static',
            'css',
            'pages.min.css'
        )
    );
    fs.unlinkSync(
        path.join(
            __dirname,
            'modules',
            'pages',
            'static',
            'css',
            'browse.min.css'
        )
    );
    fs.unlinkSync(
        path.join(__dirname, 'modules', 'pages', 'static', 'js', 'pages.min.js')
    );
    fs.unlinkSync(
        path.join(
            __dirname,
            'modules',
            'pages',
            'static',
            'js',
            'browse.min.js'
        )
    );
    fs.unlinkSync(
        path.join(
            __dirname,
            'modules',
            'navigation',
            'static',
            'css',
            'navigation.min.css'
        )
    );
    fs.unlinkSync(
        path.join(
            __dirname,
            'modules',
            'navigation',
            'static',
            'js',
            'navigation.min.js'
        )
    );
    fs.unlinkSync(
        path.join(
            __dirname,
            'modules',
            'updates',
            'static',
            'css',
            'updates.min.css'
        )
    );
    fs.unlinkSync(
        path.join(
            __dirname,
            'modules',
            'updates',
            'static',
            'js',
            'updates.min.js'
        )
    );
    fs.unlinkSync(
        path.join(
            __dirname,
            'modules',
            'backup',
            'static',
            'css',
            'backup.min.css'
        )
    );
    fs.unlinkSync(
        path.join(
            __dirname,
            'modules',
            'backup',
            'static',
            'js',
            'backup.min.js'
        )
    );
    fs.unlinkSync(
        path.join(
            __dirname,
            'modules',
            'dashboard',
            'static',
            'css',
            'dashboard.min.css'
        )
    );
    fs.unlinkSync(
        path.join(
            __dirname,
            'modules',
            'dashboard',
            'static',
            'js',
            'dashboard.min.js'
        )
    );
});

gulp.task('dashboard', async() => {
    // Generate CSS
    gulp
        .src(['modules/dashboard/static/css/dashboard.css'], {
            base: __dirname
        })
        .pipe(minifyCSS())
        .pipe(concat('dashboard.min.css'))
        .pipe(gulp.dest(path.join('modules', 'dashboard', 'static', 'css')));
    // Generate dashboard.min.js
    gulp
        .src(['modules/dashboard/static/js/dashboard.js'], { base: __dirname })
        .pipe(
            babel({
                presets: ['env']
            })
        )
        .pipe(concat('dashboard.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest(path.join('modules', 'dashboard', 'static', 'js')));
});

gulp.task('panel', async() => {
    // Generate CSS
    gulp
        .src(
            [
                'static/zoia/3rdparty/uikit/css/uikit.min.css',
                'static/zoia/3rdparty/perfect-scrollbar/css/perfect-scrollbar.min.css',
                'static/zoia/core/css/panel.css'
            ], { base: __dirname }
        )
        .pipe(minifyCSS())
        .pipe(concat('panel.min.css'))
        .pipe(gulp.dest(path.join('static', 'zoia', 'core', 'css')));
    // Generate panel.min.js
    gulp
        .src(
            [
                'static/zoia/3rdparty/jquery/jquery.min.js',
                'static/zoia/3rdparty/uikit/js/uikit.min.js',
                'static/zoia/3rdparty/uikit/js/uikit-icons.min.js',
                'static/zoia/3rdparty/uikit/js/uikit-fa-icons.min.js',
                'static/zoia/3rdparty/perfect-scrollbar/js/perfect-scrollbar.jquery.min.js'
            ], { base: __dirname }
        )
        .pipe(concat('panel.min.js'))
        .pipe(gulp.dest(path.join('static', 'zoia', 'core', 'js')));
});

gulp.task('users', async() => {
    // Generate CSS
    gulp
        .src(['modules/users/static/css/users.css'], { base: __dirname })
        .pipe(minifyCSS())
        .pipe(concat('users.min.css'))
        .pipe(gulp.dest(path.join('modules', 'users', 'static', 'css')));
    gulp
        .src(['modules/users/static/css/frontend.css'], { base: __dirname })
        .pipe(minifyCSS())
        .pipe(concat('frontend.min.css'))
        .pipe(gulp.dest(path.join('modules', 'users', 'static', 'css')));
    // Generate users.min.js
    gulp
        .src(
            [
                'static/zoia/core/js/jquery.zoiaFormBuilder.js',
                'static/zoia/core/js/jquery.zoiaTable.js',
                'modules/users/static/js/users.js'
            ], { base: __dirname }
        )
        .pipe(
            babel({
                presets: ['env']
            })
        )
        .pipe(concat('users.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest(path.join('modules', 'users', 'static', 'js')));
    // Generate frontend.min.js
    gulp
        .src(['modules/users/static/js/frontend.js'], { base: __dirname })
        .pipe(
            babel({
                presets: ['env']
            })
        )
        .pipe(concat('frontend.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest(path.join('modules', 'users', 'static', 'js')));
});

gulp.task('groups', async() => {
    // Generate CSS
    gulp
        .src(['modules/groups/static/css/groups.css'], { base: __dirname })
        .pipe(minifyCSS())
        .pipe(concat('groups.min.css'))
        .pipe(gulp.dest(path.join('modules', 'groups', 'static', 'css')));
    // Generate groups.min.js
    gulp
        .src(
            [
                'static/zoia/core/js/jquery.zoiaFormBuilder.js',
                'static/zoia/core/js/jquery.zoiaTable.js',
                'modules/groups/static/js/groups.js'
            ], { base: __dirname }
        )
        .pipe(
            babel({
                presets: ['env']
            })
        )
        .pipe(concat('groups.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest(path.join('modules', 'groups', 'static', 'js')));
});

gulp.task('auth', async() => {
    // Generate CSS
    await new Promise(resolve => {
        gulp
            .src(
                [
                    'static/zoia/3rdparty/uikit/css/uikit.min.css',
                    'modules/auth/static/css/login.css'
                ], { base: __dirname }
            )
            .pipe(minifyCSS())
            .pipe(concat('login.min.css'))
            .pipe(gulp.dest(path.join('modules', 'auth', 'static', 'css')))
            .on('end', resolve);
    });
    await new Promise(resolve => {
        gulp
            .src(['modules/auth/static/css/register.css'], { base: __dirname })
            .pipe(minifyCSS())
            .pipe(concat('register.min.css'))
            .pipe(gulp.dest(path.join('modules', 'auth', 'static', 'css')))
            .on('end', resolve);
    });
    await new Promise(resolve => {
        gulp
            .src(['modules/auth/static/css/resetConfirm.css'], {
                base: __dirname
            })
            .pipe(minifyCSS())
            .pipe(concat('resetConfirm.min.css'))
            .pipe(gulp.dest(path.join('modules', 'auth', 'static', 'css')))
            .on('end', resolve);
    });
    await new Promise(resolve => {
        gulp
            .src(['modules/auth/static/css/reset.css'], { base: __dirname })
            .pipe(minifyCSS())
            .pipe(concat('reset.min.css'))
            .pipe(gulp.dest(path.join('modules', 'auth', 'static', 'css')))
            .on('end', resolve);
    });
    await new Promise(resolve => {
        gulp
            .src(['modules/auth/static/css/registerConfirm.css'], {
                base: __dirname
            })
            .pipe(minifyCSS())
            .pipe(concat('registerConfirm.min.css'))
            .pipe(gulp.dest(path.join('modules', 'auth', 'static', 'css')))
            .on('end', resolve);
    });
    // Generate JS bundle for UIkit
    await new Promise(resolve => {
        gulp
            .src(
                [
                    'static/zoia/3rdparty/jquery/jquery.min.js',
                    'static/zoia/3rdparty/uikit/js/uikit.min.js',
                    'static/zoia/3rdparty/uikit/js/uikit-icons.min.js'
                ], { base: __dirname }
            )
            .pipe(concat('bundle.min.js'))
            .pipe(
                gulp.dest(
                    path.join('static', 'zoia', '3rdparty', 'uikit', 'js')
                )
            )
            .on('end', resolve);
    });
    // Generate login.min.js
    await new Promise(resolve => {
        gulp
            .src(
                [
                    'static/zoia/core/js/jquery.zoiaFormBuilder.js',
                    'modules/auth/static/js/login.js'
                ], { base: __dirname }
            )
            .pipe(
                babel({
                    presets: ['env']
                })
            )
            .pipe(concat('login'))
            .pipe(uglify())
            .pipe(gulp.dest(path.join('modules', 'auth', 'static', 'js')))
            .on('end', resolve);
    });
    await new Promise(resolve => {
        gulp
            .src(
                [
                    'static/zoia/3rdparty/uikit/js/bundle.min.js',
                    'modules/auth/static/js/auth-fa-icons.min.js',
                    'modules/auth/static/js/login'
                ], { base: __dirname }
            )
            .pipe(concat('login.min.js'))
            .pipe(gulp.dest(path.join('modules', 'auth', 'static', 'js')))
            .on('end', resolve);
    });
    fs.unlinkSync(
        path.join(__dirname, 'modules', 'auth', 'static', 'js', 'login')
    );
    // Generate register.min.js
    await new Promise(resolve => {
        gulp
            .src(
                [
                    'static/zoia/core/js/jquery.zoiaFormBuilder.js',
                    'modules/auth/static/js/register.js'
                ], { base: __dirname }
            )
            .pipe(
                babel({
                    presets: ['env']
                })
            )
            .pipe(concat('register'))
            .pipe(uglify())
            .pipe(gulp.dest(path.join('modules', 'auth', 'static', 'js')))
            .on('end', resolve);
    });
    await new Promise(resolve => {
        gulp
            .src(
                [
                    'static/zoia/3rdparty/uikit/js/bundle.min.js',
                    'modules/auth/static/js/register'
                ], { base: __dirname }
            )
            .pipe(concat('register.min.js'))
            .pipe(gulp.dest('modules/auth/static/js/'))
            .on('end', resolve);
    });
    fs.unlinkSync(
        path.join(__dirname, 'modules', 'auth', 'static', 'js', 'register')
    );
    // Generate registerConfirm.min.js
    await new Promise(resolve => {
        gulp
            .src('modules/auth/static/js/registerConfirm.js')
            .pipe(
                babel({
                    presets: ['env']
                })
            )
            .pipe(concat('registerConfirm.min.js'))
            .pipe(uglify())
            .pipe(gulp.dest(path.join('modules', 'auth', 'static', 'js')))
            .on('end', resolve);
    });
    // Generate reset.min.js
    await new Promise(resolve => {
        gulp
            .src(
                [
                    'static/zoia/core/js/jquery.zoiaFormBuilder.js',
                    'modules/auth/static/js/reset.js'
                ], { base: __dirname }
            )
            .pipe(
                babel({
                    presets: ['env']
                })
            )
            .pipe(concat('reset'))
            .pipe(uglify())
            .pipe(gulp.dest(path.join('modules', 'auth', 'static', 'js')))
            .on('end', resolve);
    });
    await new Promise(resolve => {
        gulp
            .src(
                [
                    'static/zoia/3rdparty/uikit/js/bundle.min.js',
                    'modules/auth/static/js/reset'
                ], { base: __dirname }
            )
            .pipe(concat('reset.min.js'))
            .pipe(gulp.dest(path.join('modules', 'auth', 'static', 'js')))
            .on('end', resolve);
    });
    fs.unlinkSync(
        path.join(__dirname, 'modules', 'auth', 'static', 'js', 'reset')
    );
    // Generate resetConfirm.min.js
    await new Promise(resolve => {
        gulp
            .src(
                [
                    'static/zoia/core/js/jquery.zoiaFormBuilder.js',
                    'modules/auth/static/js/resetConfirm.js'
                ], { base: __dirname }
            )
            .pipe(
                babel({
                    presets: ['env']
                })
            )
            .pipe(concat('resetConfirm.min.js'))
            .pipe(uglify())
            .pipe(gulp.dest(path.join('modules', 'auth', 'static', 'js')))
            .on('end', resolve);
    });
});

gulp.task('pages', async() => {
    // Generate CSS
    await new Promise(resolve => {
        gulp
            .src(
                [
                    'static/zoia/3rdparty/jstree/themes/default/style.min.css',
                    'modules/pages/static/css/pages.css'
                ], { base: __dirname }
            )
            .pipe(minifyCSS())
            .pipe(concat('pages.min.css'))
            .pipe(gulp.dest(path.join('modules', 'pages', 'static', 'css')))
            .on('end', resolve);
    });
    await new Promise(resolve => {
        gulp
            .src(
                [
                    'static/zoia/3rdparty/uikit/css/uikit.min.css',
                    'modules/pages/static/css/browse.css'
                ], { base: __dirname }
            )
            .pipe(minifyCSS())
            .pipe(concat('browse.min.css'))
            .pipe(gulp.dest(path.join('modules', 'pages', 'static', 'css')))
            .on('end', resolve);
    });
    // Generate pages.min.js
    await new Promise(resolve => {
        gulp
            .src(
                [
                    'static/zoia/core/js/jquery.zoiaFormBuilder.js',
                    'static/zoia/core/js/jquery.zoiaTable.js',
                    'modules/pages/static/js/pages.js'
                ], { base: __dirname }
            )
            .pipe(
                babel({
                    presets: ['env']
                })
            )
            .pipe(concat('pages'))
            .pipe(uglify())
            .pipe(gulp.dest(path.join('modules', 'pages', 'static', 'js')))
            .on('end', resolve);
    });
    await new Promise(resolve => {
        gulp
            .src(
                [
                    'static/zoia/3rdparty/jstree/jstree.min.js',
                    'modules/pages/static/js/pages'
                ], { base: __dirname }
            )
            .pipe(concat('pages.min.js'))
            .pipe(gulp.dest(path.join('modules', 'pages', 'static', 'js')))
            .on('end', resolve);
    });
    fs.unlinkSync(
        path.join(__dirname, 'modules', 'pages', 'static', 'js', 'pages')
    );
    // Generate browse.min.js
    await new Promise(resolve => {
        gulp
            .src(
                [
                    'static/zoia/3rdparty/jquery/jquery.shifty.min.js',
                    'static/zoia/3rdparty/jquery/jquery.finger.min.js',
                    'static/zoia/3rdparty/plupload/plupload.min.js'
                ], { base: __dirname }
            )
            .pipe(concat('plugins'))
            .pipe(gulp.dest(path.join('modules', 'pages', 'static', 'js')))
            .on('end', resolve);
    });
    await new Promise(resolve => {
        gulp
            .src(['modules/pages/static/js/browse.js'], { base: __dirname })
            .pipe(
                babel({
                    presets: ['env']
                })
            )
            .pipe(concat('browse'))
            .pipe(uglify())
            .pipe(gulp.dest(path.join('modules', 'pages', 'static', 'js')))
            .on('end', resolve);
    });
    await new Promise(resolve => {
        gulp
            .src(
                [
                    'static/zoia/3rdparty/uikit/js/bundle.min.js',
                    'modules/pages/static/js/plugins',
                    'modules/pages/static/js/browse'
                ], { base: __dirname }
            )
            .pipe(concat('browse.min.js'))
            .pipe(gulp.dest(path.join('modules', 'pages', 'static', 'js')))
            .on('end', resolve);
    });
    fs.unlinkSync(
        path.join(__dirname, 'modules', 'pages', 'static', 'js', 'browse')
    );
    fs.unlinkSync(
        path.join(__dirname, 'modules', 'pages', 'static', 'js', 'plugins')
    );
});

gulp.task('navigation', async() => {
    // Generate CSS
    await new Promise(resolve => {
        gulp
            .src(
                [
                    'static/zoia/3rdparty/jstree/themes/default/style.min.css',
                    'modules/navigation/static/css/navigation.css'
                ], { base: __dirname }
            )
            .pipe(minifyCSS())
            .pipe(concat('navigation.min.css'))
            .pipe(
                gulp.dest(path.join('modules', 'navigation', 'static', 'css'))
            )
            .on('end', resolve);
    });
    // Generate navigation.min.js
    await new Promise(resolve => {
        gulp
            .src(
                [
                    'static/zoia/core/js/jquery.zoiaFormBuilder.js',
                    'modules/navigation/static/js/navigation.js'
                ], { base: __dirname }
            )
            .pipe(
                babel({
                    presets: ['env']
                })
            )
            .pipe(concat('navigation'))
            .pipe(uglify())
            .pipe(gulp.dest(path.join('modules', 'navigation', 'static', 'js')))
            .on('end', resolve);
    });
    await new Promise(resolve => {
        gulp
            .src(
                [
                    'static/zoia/3rdparty/jstree/jstree.min.js',
                    'modules/navigation/static/js/navigation'
                ], { base: __dirname }
            )
            .pipe(concat('navigation.min.js'))
            .pipe(gulp.dest(path.join('modules', 'navigation', 'static', 'js')))
            .on('end', resolve);
    });
    fs.unlinkSync(
        path.join(
            __dirname,
            'modules',
            'navigation',
            'static',
            'js',
            'navigation'
        )
    );
});

gulp.task('updates', async() => {
    // Generate CSS
    gulp
        .src(['modules/updates/static/css/updates.css'], { base: __dirname })
        .pipe(minifyCSS())
        .pipe(concat('updates.min.css'))
        .pipe(gulp.dest(path.join('modules', 'updates', 'static', 'css')));
    // Generate updates.min.js
    gulp
        .src(['modules/updates/static/js/updates.js'], { base: __dirname })
        .pipe(
            babel({
                presets: ['env']
            })
        )
        .pipe(concat('updates.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest(path.join('modules', 'updates', 'static', 'js')));
});

gulp.task('backup', async() => {
    // Generate CSS
    gulp
        .src(['modules/backup/static/css/backup.css'], { base: __dirname })
        .pipe(minifyCSS())
        .pipe(concat('backup.min.css'))
        .pipe(gulp.dest(path.join('modules', 'backup', 'static', 'css')));
    // Generate backup.min.js
    gulp
        .src(['modules/backup/static/js/backup.js'], { base: __dirname })
        .pipe(
            babel({
                presets: ['env']
            })
        )
        .pipe(concat('backup.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest(path.join('modules', 'backup', 'static', 'js')));
});

gulp.task('default', function() {
    gulp.start('dashboard');
    gulp.start('panel');
    gulp.start('users');
    gulp.start('groups');
    gulp.start('auth');
    gulp.start('pages');
    gulp.start('navigation');
    gulp.start('updates');
    gulp.start('backup');
});