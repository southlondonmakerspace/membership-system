const autoprefixer = require('autoprefixer');
const gulp = require('gulp');
const postcss = require('gulp-postcss');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');

gulp.task('css', () => {
	return gulp.src('./static/scss/**/*.scss')
		.pipe(sourcemaps.init())
		.pipe(sass().on('error', sass.logError))
		.pipe(postcss([autoprefixer()]))
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest('./static/css'));
});

gulp.task('build', ['css']);

gulp.task('watch', () => {
	gulp.watch('./static/scss/**/*.scss', ['css']);
});
