//注意事项：
/*
 * 为避免污染全局变量，使用IIFE
 * 只支持在modules下制作插件
 * 为了防止插件之间的冲突，请确保modules文件夹下，制作的插件变量名和文件夹名称一致
 */
module.exports = function(grunt) {

	grunt.initConfig({
		jshint: {
			src: ['Gruntfile.js', 'src/**/*.js']
		},
		watch: {
			jshint: {
				files: ['Gruntfile.js', 'src/**/*.js'],
				tasks: ['jshint']
			}
		},
		concat: {
			js: {
				src: '<%= concatJsSrc %>',
				dest: '<%= concatJsDest %>'
			},
			css: {
				src: '<%= concatCssSrc %>',
				dest: '<%= concatCssDest %>'
			}
		},
		uglify: {
			all: {
                src: 'dist/mho.all.js',
                dest: 'dist/mho.all.min.js'
            },
			modules: {
                src: 'dist/modules/mho.modules.js',
                dest: 'dist/modules/mho.modules.min.js'
            }
		},
		cssmin: {
			all: {
                src: 'dist/mho.all.css',
                dest: 'dist/mho.all.min.css'
            },
			modules: {
                src: 'dist/modules/mho.modules.css',
                dest: 'dist/modules/mho.modules.min.css'
            }
		}
	});
	
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	
	grunt.registerTask('default', ['jshint', 'watch']);
	
	
	//运行方式
	//打包所有>grunt build
	//打包指定插件>grunt build:table,form,tab
	grunt.registerTask('build', function(modules) {
		var jsSrc = ['src/mho.js', 'src/modules/**/*.js'],
			jsDest = 'dist/mho.all.js',
			cssSrc = ['src/mho.css', 'src/modules/**/*.css'],
			cssDest = 'dist/mho.all.css',
			uglify = modules ? 'uglify:modules' : 'uglify:all';
			cssmin = modules ? 'cssmin:modules' : 'cssmin:all';
		if(modules) {
			modules = modules.split(',');
			jsSrc = ['src/mho.js'];
			jsDest = 'dist/modules/mho.modules.js';
			cssSrc = ['src/mho.css'];
			cssDest = 'dist/modules/mho.modules.css';
			for(var i=0; i<modules.length; i++) {
				jsSrc.push('src/modules/'+modules[i]+'/*.js');
				cssSrc.push('src/modules/'+modules[i]+'/*.css');
			}
		}
		grunt.config.set('concatJsSrc', jsSrc);
		grunt.config.set('concatJsDest', jsDest);
		grunt.config.set('concatCssSrc', cssSrc);
		grunt.config.set('concatCssDest', cssDest);
		grunt.task.run('jshint');
		grunt.task.run('concat');
		grunt.task.run(uglify);
		grunt.task.run(cssmin);
	});
	
};