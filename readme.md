# Membership System
This is a membership management system, it's chiefly a database of member data for legal purposes, setting up subscription payments, managing access control permissions, logging events, and interfacing with Discourse permissions.

This system was created for [South London Makerspace](http://southlondonmakerspace.org).

## Setup
There are two options for setup, either as a new install (Steps 1, 2, 3a, 4, 5), or importing dry test data from the [data drier](https://github.com/southlondonmakerspace/membership-dryer) (Steps 1, 2, 3b, 4, 5), which is currently not publicly available.

## 1. Prerequisites
Before you can start the server you'll need to ensure:

- Node.js is installed
- MongoDB is installed

### 2. Before install
1. Clone the repo into a folder.
1. Copy the example config in the `config` folder, naming it `config.json`. Complete the details.

### 3a. New install
1. Use `npm install` to install the numerous dependencies.
1. Run `npm run first-time` to create the basic necessary database entries.

### 3b. Import
1. Ensure the `permissions` section is complete to match the server where data was exported from, especially the `admin` and `superadmin` details.
1. Use `npm install` to install the numerous dependencies.
1. Run `npm run import <path to dry data>` to import the dry data.

### 4. After install
1. Run `npm run new-user` to create an activated super admin user.
1. Start the main server using `npm run start`.
1. Open a browser to `http://localhost:3001`.

### 5. Further steps
The system is now up and running, however you'll need to review:
- HTTPs via Nginx as a proxy, so requests to https://localhost are proxied by Nginx to http://localhost:3001.
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

## Reverse proxy
If running behind a reverse proxy, you should configure your proxy to add the `X-Forwarded-*` headers (see [nginx documentation](https://www.nginx.com/resources/wiki/start/topics/examples/forwarded/)), and also set reverseProxyTrust variable in `config/config.json`
