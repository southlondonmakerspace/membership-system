# Membership System

This system was originally created for
[South London Makerspace](http://southlondonmakerspace.org)
and repurposed by [The Bristol Cable](https://thebristolcable.org).

Browser testing with<br/>
<a href="https://www.browserstack.com/"><img src="https://user-images.githubusercontent.com/2084823/46341120-52388b00-c62f-11e8-8f41-270915ccc03b.png" width="150" /></a>

### Integrations
- GoCardless for direct debits
- MailChimp for newsletters
- Mandrill for transactional emails
- Discourse for forums (not sure what the state of this is)

## Development

### Setup

#### 1. Prerequisites
Before you can start the server you'll need to ensure:

- Node.js is installed
- MongoDB is installed

#### 2. Before install
1. Clone the repo into a folder.
1. Copy the example config in the `config` folder, naming it `config.json`.
   Complete the details.

#### 3. New install
1. Use `npm install` to install the numerous dependencies.
1. Run `npm run first-time` to create the basic necessary database entries.
1. [Temporary step] In the config file update `permission.memberId` to match
   the ID returned by:
   ```
   tools/database/shell.sh
   db.permissions.findOne({"slug": "member"})._id
   ```
1. Optionally import data using `node tools/database/import.json` if you have
   access to an anonymised export.

#### 4. After install
1. Run `npm run new-user` to create an activated super admin user.
1. Start the main server using `npm start`.
1. Open a browser to `http://localhost:3001`.

## Deployment

### Setup

Currently setting up a production environment involves following the guide in
`tools/install.sh`

### Updating

```
git pull
pm2 restart config/ecosystem.prod.js
```

## Creating Apps
The system is built around modular apps. If you're looking to add functionality
to the site the best way to do this would by adding an app to the site rather
than modifying it's base. This means you're unlikely to mess anything up.

As an example, let's add a login page.

Stub out your app structure within `app/`, this will include:

	apps/
		login/
			views/
				app.js
				config.js


Check out these files to get an idea of how each of these should be structure.
