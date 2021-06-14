module.exports = {
    plugins: {
        autoprefixer: {},
        "postcss-url": {},
        "postcss-preset-env": {
            browsers: "last 2 versions",
            stage: 0,
        },
        "postcss-csso": {
            restructure: true
        }
    },
};
