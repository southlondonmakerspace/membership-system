# Guide to Contributing

Thanks for helping out with our development!  This guide will outline how we expect contributions to our code to work, and the best way to help our development.

## Code of Conduct

This project is developed by the South London Makerspace, and as such we expect all contributors to follow the [South London Makerspace Code of Conduct](https://southlondonmakerspace.org/code-of-conduct) ([internal discourse link here](https://discourse.southlondonmakerspace.org/t/code-of-conduct/53)).  

South London Makerspace is dedicated to providing a harassment-free experience for everyone, regardless of gender, gender identity and expression, sexual orientation, disability, physical appearance, body size, race, or religion. We do not tolerate harassment of people at our events or space in any form. People violating these rules may be sanctioned or expelled from the space or the event at the discretion of any South London Makerspace member.

## I have a question
Rather than creating an issue, you're better off joining the [South London Makerspace Discourse](https://discourse.southlondonmakerspace.org/) and asking there first, tagging @systems for their attention.  

## What should I know before starting?
The Membership System is a project bourne from the necessity of a UK company to keep records of all it's members, as well as taking membership payments.  It has organically grown over the life of South London Makerspace, as have the skills and experience of those contributing to it.  

The intention is that the system is able to be very modular.  The easiest way to add functionality is creating an app - take a look in the `apps` folder for examples of this.  Apps are not entirely self contained - database models are kept separately at present, and common functionality modules too - look in `src/js` for some examples.  

## Contributing code

Ready to contribute some code? Great! Here's how to get started

### Pick a bug to squash
Have a look through our list of issues, and pick something to work on. Issues labeled bug are higher priority than those labelled enhancement.  One with a ['help-wanted'](https://github.com/southlondonmakerspace/membership-system/labels/help%20wanted) label might be good to start with, just to get into the swing of things.

### Forking and Pull Requests

Once you have picked an issue to work on, follow these steps:

* Fork this repo, clone it and make sure the [upstream](https://akrabat.com/the-beginners-guide-to-contributing-to-a-github-project/) is set up correctly.
* Checkout the dev branch.
* Pick an issue to work on -  
* Make a branch from dev, named `is-number` (where `number` is the issue number you are working on).
* Do the code to fix that issue (and only that issue!).
* Keep the number of commits to a minimum, only commit working code, and write [good commit messages](https://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html). You may also want to squash your commits using an [interactive rebase](https://help.github.com/articles/about-git-rebase/)
* Perform a `git fetch upstream && git merge upstream/dev` on your branch to include any changes that have been made since you branched. Resolve any conflicts before proceeding.
* When you're ready, create a pull request from your `is-number` branch to upstream `dev` branch.
* Your code will be reviewed - if changes are requested, commit them to your `is-number` branch, and the pull request will automatically update.
* Once the reviewers are happy, your code will be pulled into the dev branch upstream, and eventually make their way into a release.
* You should delete your branch once it has been merged, and start over forking from `dev`


### Development Environment

You'll need to set up an environment for developing within - chances are you already have one.  If you need advice on which IDE to use we would recommend [Atom](https://atom.io/).  

#### Docker Image
Once you've forked the repo (as above), setting up a development environment is quite easy so long as you have [Docker](https://docker.com/) installed.  We have a docker-compose file, so bringing up an environment should be as simple as:

```
docker-compose build
docker-compose up
```

This will install the app into a container, with an accompanying MongoDB.  You'll need to create a `config/config.json` file - copy this from `config/example-config.json`, but change the following keys:

```
  "host": "0.0.0.0",
  ...
  "mongo": "mongodb://db/membership-system",

```

You'll need to run `docker-compose build` every time you make a change to load the new code into the app container (this might change later!).

The first time you run up the system with a new database volume, you'll need to initialise the database.  To do this, you'll need to get a shell on the app container and run the first-time and new-user scripts, like so:

```
$ docker exec -it membershipsystem_membership_1 sh
/usr/src/app # npm run first-time
.... some stuff will happen ...
/usr/src/app # npm run new-user
... you'll be prompted to create a new user ...
/usr/src/app # (Ctrl-D)
```

Make sure your first user is given Super-Admin permissions, and membership.  You can use this script to create subsequent users as well, should you wish.
#### Native environment

You can run the code on your own machine - you will need:

* Node v6.11.1 (we recommend [nvm](https://github.com/creationix/nvm) to install this)
* [MongoDB](https://www.mongodb.com/)

You'll need to configure the application by copying `config/example-config.json` to `config/config.json`.  You shouldn't need to change anything to get running to start with.  

You will need to run the first-time and new-user scripts to create the database entries required:

```
$ npm run first-time
$ npm run new-user
```


### Quality Expectations

There is an expectation that contributions will be of a certain quality.

#### Data Privacy

At no point should code expose sensitive information to unauthorised users - systems administrators should not have access to any sensitive information unless specifically authorised (therefore, logging must be handled very carefully).  

Data should be handled in a way which could fulfil the requirements of [Data Protection laws in the UK](https://www.gov.uk/data-protection) (including [GPDR](https://ico.org.uk/for-organisations/guide-to-the-general-data-protection-regulation-gdpr/) ).  Not all of the requirements can be fulfilled by the application itself (and must be implemented by a systems administrator), but the application should not prevent measures from being taken.

[Sensitive personal data](https://www.legislation.gov.uk/ukpga/1998/29/section/2) information which requires special protection may include:
* ethnic background
* political opinions
* religious beliefs
* health
* sexual health
* criminal records

Storing these data should be avoided.  

#### Code Style

(tbd!)

#### Apps

If you are developing an app, we expect:

* There should be no path which a user can navigate to that will cause the application to crash - make sure you catch all exceptions and handle them correctly!
* Pug templates should use mixins wherever possible (check out some other apps for examples)

#### Core functionality

If you are making a change to core functionality:
* Any code should be fully backwards compatible. The only exception for this is if it is for a major version upgrade - in which case a migration path should be provided from the previous major version.
* The behaviour of existing APIs should not change from the perspective of clients - if a change is required, a new API should be created instead.
