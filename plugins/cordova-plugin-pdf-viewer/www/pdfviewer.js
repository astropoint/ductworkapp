//PDFViewer based on ChildBrowser

/* MIT licensed */
// (c) 2010 Jesse MacFadyen, Nitobi
//
//  PDFViewer
//  CDVEmailComposer Template Created Jan 7 2013
//  Copyright 2013 @RandyMcMillan

var exec = require('cordova/exec');

var PDFViewer = {

	// Callback when the user chooses the 'Done' button
	// called from native
	_onClose: function() {
		this.onClose();
	},

	/* The interface that you will use to access functionality */

	// Show a webpage, will result in a callback to onLocationChange
	showPDF: function(loc) {
		exec(null, null, 'PDFViewer', 'showPDF', [loc]);
	},

	// close the browser, will NOT result in close callback
	close: function() {
		exec(null, null, 'PDFViewer', 'close', []);
	},

	// Not Implemented
	jsExec: function(jsString) {}
};

module.exports = PDFViewer;