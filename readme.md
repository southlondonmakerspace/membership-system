Membership System
===

This is a system for managing membership and payment to [South London Makerspace](http://southlondonmakerspace.org).

Setup
---

You need to install and run mongodb as described [here](https://docs.mongodb.org/manual/installation/)

Clone the repo. Then run:
```
npm update
```

Configuration
---

You can automatically compile your css as you edit the less files by running:
```
npm run watch
```

To run the application:
```
npm start
```

By default it will then be available on `http://localhost:3001/`
The port is configurable in the  `config/config.json`
Creating Apps
===

The system is built around modular apps. If you're looking to add functionality to the site the best way to do this would by adding an app to the site rather than modifying it's base. This means you're unlikely to mess anything up.

As an example, let's add a login page.

Stub out your app structure within `app/`, this will include:

```
apps/
  login/
    views/
    app.js
    config.js
```

Check out these files to get an idea of how each of these should be structure.
