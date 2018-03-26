# Guide to Contributing

If you want to contribute code, fix a bug - this is the process of how we expect this to work

 * Fork this repo.
 * Checkout the dev branch.
 * Make a branch from dev and make your changes.
 * Do a pull request from your branch into our dev branch, referencing the issue tag if relevent.
 * The maintainers review and approve it, as required.
 * Releases are preceded by a PR from dev into master - at this point your code will be live.

## Development Environment

This project is entirely Node.JS.  We have a docker-compose file, so bringing up an environment should be as simple as:

```
$ docker-compose build
$ docker-compose up
```

This will install the app into a container, with an accompanying MongoDB.  You'll need to create a `config/config.json` file - copy this from `config/example-config.json`, but change the following keys:

```
	"host": "0.0.0.0",
  ...
  "mongo": "mongodb://db/membership-system",

```

That should be it.  
