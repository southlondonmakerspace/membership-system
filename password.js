var crypto = require( 'crypto' );

var password = 'kittens';

console.log( '=[ PASSWORD ]====================' );
console.log( password );

crypto.randomBytes( 256, function( ex, salt ) {
	salt = salt.toString( 'hex' );
	console.log( '=[ SALT ]========================' );
	console.log( salt );

	crypto.pbkdf2( password, salt, 1000, 512, 'sha512', function( err, hash ) {
		hash = hash.toString( 'hex' );
		console.log( '=[ HASH ]========================' );
		console.log( hash );
	} );
} );

var hash = "b77934eb25a7a5a67063260c01f844013edafc59b8be8e298ae766f6508b1d5b2ea87901be5c3b77cdcbe5e1443b377c033b36b4f55d09568a2de66314969c0c58093fb2c20d429ef2b53b25e58a21f2866c42c11505a795e46d31aa0ccf8c1ad2a3e344f935c64e2c9089c4e5375cff0dab0803ead9ebd1f611c31cd82386d954829e01eeb8742156082fb11e74bd6687fee0a30e735b0aa413c7caa525158bcf7612378951af9b271b764c996be85a0d21a11d812b2725626f764f7d0646fb88e1ff97d3d02e4b7e9668cd61ef7d4f5f528a6ed14d3844dbb886102bdc2d21b34cecdbca6827954bd00e57ac4081a1469876fa2dbbd9ff53615fb78f92d35eb020e812c8b76ff7069556d21f14dee95a79df9c1701fa3a8e2d9e0c070865d74f9f24248e8c57fc94068dce3441e59b8fd7346f04f1a2d678157d1fb0bfd9707b0d6c26c2e3052c43f9029eaf9dda265ce6f4a9fa21de0bbd84b1dd7d1b1cd1a2965d5311dd4734047279bc5068b64e50731f500f209c689ced9bd6236955a1fcaff48a41a31545d84c68cc73eabe0f708cc75dd43b1e6d7a3b3f63af042b32367eb4a6af5d8b0c55b2cfb5af939034cbdecf7ea93a047f4f4f8c31922f11922322f9a6614173f40f36162874fb7152399814c87792ff2e2ba8474dafc150265fd488353765d90307c52e24756027a508eb6112d174efb98da8f0122ef654bd";
var salt = "651546a6c6debdbf45beb0978755ac465360ce2c650caf1c669b17a7d3e850dc0214ec41a0094125c82faeb6fdff83bd9cf774cf0c9d702472c830b71f437be5cee4c327b7d9be3b32639cc0b3e3ec3bf51e018c95874a42c28350d391c5e6831fe18bc3af6c3207164461f85cfe83c5177ad122e9afb842308b08ffbbf81ec8b945a7485625e7d6f5bfdf061ac1b9d1e66a99390ef7d7375c7e0cb122695906e74245a97b7f051ec072e1717d3b71a392d93eb698c3519fb890b1b9f191a7f37d1b9147f2f13be2548ee74bbc742736e678091e5d5c14927ca4047f09375dd847000d10e382c9dfb37bfc491953345cad1d9d1169c1e0f16370d4996c90dc95";

console.log( '=[ REHASH A ]====================' );
console.log( hash );
	
console.log( '=[ SALT ]========================' );
console.log( salt );
	

crypto.pbkdf2( password, salt, 1000, 512, 'sha512', function( err, rehash ) {
	rehash = rehash.toString( 'hex' );
	console.log( '=[ REHASH B ]====================' );
	console.log( rehash );
	
	console.log( '=[ MATCH ]=======================' );
	if ( hash == rehash ) {
		console.log( 'Hashes match' );
	} else {
		console.log( 'Hashes do not match' );
	}
	console.log( '=================================' );
} );