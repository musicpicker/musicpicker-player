module.exports = function(grunt) {
	grunt.initConfig({
		'create-windows-installer': {
		  x64: {
		    appDirectory: './builds/Musicpicker-win32-x64',
		    outputDirectory: './builds/windows',
		    authors: 'Musicpicker',
		    description: 'Musicpicker native client and player',
		    exe: 'Musicpicker.exe'
		  }
		}
	});

	grunt.loadNpmTasks('grunt-electron-installer')
}