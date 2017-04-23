# Membership System
This is a membership management system, it's chiefly a database of member data for legal purposes, setting up subscription payments, managing access control permissions, logging events, and interfacing with Discourse permissions.

This system was created for [South London Makerspace](http://southlondonmakerspace.org).

## Setup
The system is dependent on a number of NPM modules, and Mongo DB.

1. Clone the repo into a folder.
1. Copy the example config in the `config` folder, naming it `config.json`. Complete the details.
1. Use `npm update` to install the numerous dependencies.
1. Run `node first-time.js` to create the basic necessary database entries to avoid crashing.
1. Start the main server using `node app`.
1. Open a browser to `http://localhost:3001`.
1. Follow the process to join.
1. Ensure the email address used to join is the same as that used the `config.json`'s `superadmin` section.
1. As a logged in, activated account with `superadmin` you can now create new permissions, create the following:
  - Slug: member
  - Slug: admin (can be modified using the `config.json`)
  - Slug: superadmin (can be modified using the `config.json`)

The system is now up and running, however you'll need to review:
  - HTTPs via Nginx as a proxy, so requests to https://localhost` are proxied by Nginx to `http://localhost:3001`.
  - A firewall setup only allowing SSH + HTTPs access, specifically preventing 3001.
  - Setting up GoCardless for subscriptions.
  - Configuring Discourse for forum management.
  - Testing the API integration with your access control system.

## Creating Apps
The system is built around modular apps. If you're looking to add functionality to the site the best way to do this would by adding an app to the site rather than modifying it's base. This means you're unlikely to mess anything up.

As an example, let's add a login page.

Stub out your app structure within `app/`, this will include:

    apps/
      login/
        views/
        app.js
        config.js


Check out these files to get an idea of how each of these should be structure.
