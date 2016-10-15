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
