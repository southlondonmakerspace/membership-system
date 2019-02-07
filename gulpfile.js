const autoprefixer = require('autoprefixer');
const gulp = require('gulp');
const postcss = require('gulp-postcss');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');

function css() {
	return gulp.src('./static/scss/**/*.scss')
		.pipe(sourcemaps.init())
		.pipe(sass().on('error', sass.logError))
		.pipe(postcss([autoprefixer()]))
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('./static/css'));
}

const build = gulp.parallel(css);

function watch() {
	gulp.watch('./static/scss/**/*.scss', css);
}

module.exports = {
	default: gulp.series(build, watch),
	build,
	watch
};
