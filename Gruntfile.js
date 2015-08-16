module.exports = function(grunt) {
	grunt.initConfig({
		'create-windows-installer': {
		  x64: {
		    appDirectory: './builds/Musicpicker-win32-x64',
		    outputDirectory: './builds/windows',
		    exe: 'Musicpicker.exe',
		    setupIcon: 'musicpicker.ico'
		  }
		}
	});

	grunt.loadNpmTasks('grunt-electron-installer')
}