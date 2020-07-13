# Frontend Templates

Zoia uses Marko as a templating system. All frontend pages are rendered on the server so your website will be fully parseable by search engines.

The default template ("zoia") is a good example on how to build your own templates. To add a new template, create a directory under *shared/marko/templates/available* and put at least the following files there:

* *index.marko*: a main file of your template
* *marko.json*: a JSON file which contains settings to build Marko templates, e.g.:

```json
{
    "tags-dir": ["../.."]
}
```

The `"tags-dir": ["../.."]` value is required because your template won't find any Zoia system components like `uikit` otherwise.

## Global Variables

There are several global variables sent to each Zoia template which can be accessed with `out.global`, e.g.:

```javascript
${out.global.siteData.title}
```

The following variables are accessible in the global scope:

* *t*: language strings for the current language which can be accessed like

```javascript
${out.global.t["Log Out"]}
```

* *template*: current template ID
* *siteData.navTree*: navigation tree (see default template code on how to parse it using Marko syntax)
* *siteData.user*: current username
* *siteData.language*: current language detected by Zoia
* *siteData.languagePrefixURL*: current URL prefix which needs to be added to an URL if internationalization is required
* *siteData.languages{}*: object representing available languages (e.g. { english: "English", russian: "Русский"})
* *siteData.title*: site title
* *siteData.breadcrumbsHTML*: HTML code for current page's breadcrumbs
* *siteData.useUIkitOnFrontend*: boolean value which indicates if the UIkit shall be used on frontend (or not)
* *siteData.allowRegistration*: boolean value which indicates if a sign up of a new user is allowed in the userspace

## Marko Syntax

Read more on [Marko syntax](https://markojs.com/docs/getting-started/) to build your own templates.

## Webpack

Because all templates need to be processed before they are served by Zoia's Web Server, you will need to rebuild using `npm run build-web` each time you make any changes to any of your templates or add a new one.