# Deployment

Zoia can be deployed on any Linux, UNIX or Windows server where Node.js and MongoDB run. 

The API and Web servers can run on different physical servers.

## Static files

The static files which need to be exposed to the Web are located in *dist/static* directory. The */admin/** server location needs to point to the *dist/static/_admin/admin.html* file.

All other routes need to be checked by the server in the *dist/static* directory first; if none are found, the server (e.g. NGINX) needs to check the corresponding route on the Web server where Zoia is running. 

## Web Server

Zoia is running a Web server which handles all requests except for */admin* and */api* routes.

## API Server

Zoia is running an API server which handles all requests to the */api* route.