# Configuration files

To generate configuration files, you may run the following command:

* `npm run configure`

The files are saved to the *dist/etc* and to the *dist/static/etc directories.

Zoia can be configured using different configuration files:

* *config.json*: common configuration file (exposed to the public)
* *secure.json*: server-related configuration file (not exposed to the public)
* *templates.json*: frontend template settings

## config.json

* *id*: unique Zoia instance ID
* *languages[]*: languages supported by Zoia 
* *cookieOptions*: cookie options
* *useUIkitOnFrontend*: set to *true* if your frontend template uses UIkit CSS framework
* *api.url*: URL where the API Server can be reached
* *siteTitle*: title of your website which is used to display in a browser window
* * *siteTitleShort*: a shorter title of your website which is used to display in mails etc.
* *commonItemsLimit*: how many items to display in all generic dynamic tables (admin area)
* *allowRegistration*: allow new user sign ups
* *allowSignIn*: allow user sign ins in user space
* *wysiwyg*: use WYSIWYG editor (where applicable)

## secure.json

* *secret*: a random string used to encrypt data
* *authTokenExpiresIn*: authentication token expiration time
* *mongo.url*: URL which can be used to connect to the MongoDB server
* *mongo.dbName*: MongoDB database
* *redisEnabled*: set *true* if Zoia is allowed to use Redis (where applicable)
* *redisConfig.port*: Redis port to use
* *redisConfig.host*: Redis host to use
* *rateLimitOptionsAPI*: object which describes a configuration of *fastify-rate-limit* module for the API Server, see [module page](https://github.com/fastify/fastify-rate-limit) for more info
* *rateLimitOptionsWeb*: object which describes a configuration of *fastify-rate-limit* module for the Web Server, see [module page](https://github.com/fastify/fastify-rate-limit) for more info
* *originCORS*: CORS origin (if API server is located on a different server)
* *trustProxy*: should a proxy be trusted (useful if you are running API or Web servers behind proxy)
* *apiServer.ip*: API Server IP address
* *apiServer.port*: API Server port
* *webServer.ip*: Web Server IP
* *webServer.port*: Web Server port
* *httpDevServer.ip*: Development HTTP Server IP
* *httpDevServer.port*: Development HTTP Server port
* *development*: use development mode for your Zoia instance (useful only if you are a developer)
* *loglevel*: either "info", "warn" or "error"
* *stackTrace*: display stack traces in Log files
* *user*: username which will be used to run Zoia (useful for systemd configuration) - optional
* *group*: group which will be used to run Zoia (useful for systemd configuration) - optional
* *serverName*: server name(s) which are used for NGINX configuration - optional

## templates.json

This configuration file is built-in into both Web and API servers processed by Webpack, so after each change in this configuration file you will need to re-build Zoia using Webpack scripts.

* *available[]*: list of all available templates