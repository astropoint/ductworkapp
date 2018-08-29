// PDFViewer based on ChildBrowser

//  Created by Jesse MacFadyen on 10-05-29.
//  Copyright 2010 Nitobi. All rights reserved.
//
//  PDFViewer
//  CDVEmailComposer Template Created Jan 7 2013
//  Copyright 2013 @RandyMcMillan
//  //  Copyright 2012, Randy McMillan

#import "PDFViewer.h"
#import <Cordova/CDVViewController.h>

@implementation PDFViewer

@synthesize pdfViewer;


/*
 *
 *   - (void)myPluginMethod:(CDVInvokedUrlCommand*)command
 *   {
 *   // Check command.arguments here.
 *   [self.commandDelegate runInBackground:^{
 *   NSString* payload = nil;
 *   // Some blocking logic...
 *   CDVPluginResult* pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:payload];
 *   // The sendPluginResult method is thread-safe.
 *   [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
 *   }];
 *   }
 *
 */


- (void)showPDF:(CDVInvokedUrlCommand*)command
{
    
#pragma mark Constants
    
#define DEMO_VIEW_CONTROLLER_PUSH FALSE
    
#pragma mark UIViewController methods
    
    NSString* url = [command.arguments objectAtIndex:0];

    if (url != nil && url.length > 0) {
        
        NSURL* absoluteURL = [[NSURL URLWithString:url relativeToURL:[self.webView.request URL]] absoluteURL];
        
        if ([[NSFileManager defaultManager] fileExistsAtPath:absoluteURL.path]) {
            NSLog(@"[pdfviewer] path: %@", absoluteURL.path);
            
            ReaderDocument *document = [ReaderDocument withDocumentFilePath:absoluteURL.path password:nil];
            
            if (document != nil) {
                ReaderViewController *readerViewController = [[ReaderViewController alloc] initWithReaderDocument:document];
                readerViewController.delegate = self;
                readerViewController.modalTransitionStyle = UIModalTransitionStyleCrossDissolve;
                readerViewController.modalPresentationStyle = UIModalPresentationFullScreen;
                self.pdfViewer = readerViewController;

                [self.viewController presentViewController:readerViewController animated:YES completion:nil];
                
            }
        }
    }

}

- (void)close:(CDVInvokedUrlCommand*)command
{
	//[self.pdfViewer closeViewer];
}

- (void)onClose
{
	[self.webView stringByEvaluatingJavaScriptFromString:@"PDFViewer.onClose();"];
}

#if !__has_feature(objc_arc)
	- (void)dealloc
	{
		self.pdfViewer = nil;

		[super dealloc];
	}

#endif

@end
