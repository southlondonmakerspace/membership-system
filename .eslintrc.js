module.exports = {
	"env": {
		"es6": true,
		"node": true
	},
	"parserOptions": {
		"ecmaVersion": 9
	},
	"extends": "eslint:recommended",
	"rules": {
		"indent": [
			"error",
			"tab"
		],
		"linebreak-style": [
			"error",
			"unix"
		],
		"quotes": [
			"error",
			"single"
		],
		"semi": [
			"error",
			"always"
		],
		"no-console": [
			"off"
		],
		"no-fallthrough": [
			"off"
		],
		"no-unused-vars": "warn"
	}
};
