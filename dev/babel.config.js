module.exports = api => {
    if (api) {
        api.cache(true);
    }
    return {
        sourceType: "unambiguous",
        plugins: [
            "@babel/plugin-proposal-class-properties",
            "@babel/plugin-proposal-object-rest-spread",
            "@babel/plugin-transform-async-to-generator",
            ["@babel/transform-runtime", {
                regenerator: true,
                useESModules: false
            }]
        ],
        presets: [
            [
                "@babel/preset-env",
                {
                    targets: {
                        ie: "10"
                    }
                }
            ]
        ]
    };
};
