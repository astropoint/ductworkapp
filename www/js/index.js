$(document).ready(function(){
	//This will need to be removed when it's uploaded to phone...
	document.addEventListener('deviceready', onDeviceReady,false);
	//onDeviceReady();
	checkInternet();
	
	//check the status of the internet every 10 seconds
	setInterval(function(){
		checkInternet();

		refreshcount++;
		
		//every 5 minutes get the new lat long
		if(refreshcount%(6*5)==0){
			setLatLon();
		}
		
		if(refreshcount%(2*5)==0 && loggedIn && isInternet){
			updateSchedule(-1, '', false);
		}
	}, 10000);
	
	//setTimeout(checkIfLoggedIn, 20);
	
});

var refreshcount = 0;
var agendasort = 'desc';
var loggedIn = false;
var workorderlist;

var spinner = '<svg class="svg-inline--fa fa-spinner fa-w-16 fa-spin" aria-hidden="true" data-prefix="fas" data-icon="spinner" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" data-fa-i2svg=""><path fill="currentColor" d="M304 48c0 26.51-21.49 48-48 48s-48-21.49-48-48 21.49-48 48-48 48 21.49 48 48zm-48 368c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.49-48-48-48zm208-208c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.49-48-48-48zM96 256c0-26.51-21.49-48-48-48S0 229.49 0 256s21.49 48 48 48 48-21.49 48-48zm12.922 99.078c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48c0-26.509-21.491-48-48-48zm294.156 0c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48c0-26.509-21.49-48-48-48zM108.922 60.922c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.491-48-48-48z"></path></svg>';

var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

var destinationType;
function onDeviceReady(){
		pictureSource=navigator.camera.PictureSourceType;
		destinationType=navigator.camera.DestinationType;
		
		try{
			cordova.getAppVersion.getVersionNumber(function (version) {
				$('.versionnumber').html(version);
			});
		}catch(error){
			console.log("App version cannot be loaded, you are probably using a browser");
		}
}

var siteURL = "https://ductworkadmindev.duckdns.org";
var apiURL = siteURL+"/api/api.php";
var isInternet = false;
var maxUploadSize = 8;
var apikey = "";

function checkInternet(){
	var data = "action=checkconnection"; 
	var success = false;
	$.ajax({
			url: apiURL,
			data: data,
			dataType: "json",
			type: 'post', 
			error: function(){
					// will fire when timeout is reached
					isInternet = false;
			},
			success: function(response){
				if(response.success){
					isInternet = true;
				}else{
					isInternet = false;
				}
			},
			timeout: 3000 // sets timeout to 3 seconds
	});
}

function checkIfLoggedIn(requirelogin, redirectpage){
	loggedIn = localStorage.getItem('loggedIn');
	var hash = window.location.hash;
	
	if(requirelogin && loggedIn!='1'){
		window.location.href='#login';
	}else if(requirelogin){
		afterLoginCheck(); //requires login, is logged in, just run required function
		checkApiKey();
	}else if(!requirelogin && loggedIn=='1'){
		
		afterLoginCheck();
		checkApiKey();
		
		if(hash=='' || hash=='#login'){
			window.location.href = '#userHome';
		}
	}
}

function checkApiKey(){
	
	if(isInternet){
		var data = "action=checkapikey&apikey="+apikey;
		
		var hash = window.location.hash;
	
		if(hash!='' && hash!='#login'){
		
			$.ajax({
				url: apiURL,
				data: data,
				dataType: "json",
				type: 'post'
			}).done(function(response){
				if(!response.success){
					//key is invalid, so log out
					resetAllFields();
					window.location.href = '#login';
				}
			});
			
		}
	}
}

function showToast(message){
	try{
		window.plugins.toast.showWithOptions(
		{
			message: message,
			duration: "long",
			position: "bottom",
			styling: {
				backgroundColor: '#fae014',
				textColor: '#000000'
			}
		}, function(a){
			//Toast Success
		}, function(b){
			alert('toast error: ' + b)
		});
	}catch(error){
		alert("Unable to display toast: "+message);
	}
}

$(document).on('click', '.goback', function(e){
	window.history.back();
});

$(document).on('click',"#loginBtn",function(e){
	
	var username = $('#username').val();
	var password = $('#password').val();
	var errors = [];
	
	var goodform = true;
	if(!isInternet){
		goodform = false;
		errors.push("Unable to connect to API.  Please check your internet connection");
		//showToast("Unable to connect to API.  Please check your internet connection");
	}
	if(username=='' || username.length < 3){
		goodform = false;
		$('#username').css('border', '1px solid red');
		$('#username').css('color', 'red');
		errors.push("Your username cannot be blank");
	}else{
		$('#username').css('border', '');
		$('#username').css('color', 'black');
	}
	
	if(password==''){
		$('#password').css('border', '1px solid red');
		$('#password').css('color', 'red');
		goodform = false;
		errors.push("The password cannot be blank");
	}else{
		$('#passsword').css('border', '');
		$('#password').css('color', 'black');
	}
	
	$('#login_response').html("");
	
	if(goodform){
		data = "action=login&username="+username+"&password="+password
		$.ajax({
			url: apiURL,
			data: data,
			dataType: "json",
			type: 'post'
		}).done(function(response){
			if(response.success){
				if(response.data.loggedin){
					localStorage.setItem("loggedIn", 1);
					localStorage.setItem("username", username);
					localStorage.setItem("userid", response.data.userid);
					localStorage.setItem("apikey", response.data.apikey);
					localStorage.setItem("userid", response.data.userid);
					localStorage.setItem("full_name", response.data.full_name);
					localStorage.setItem("email", response.data.email);
					localStorage.setItem("workorders", "");
					
					afterLoginCheck();
					
					window.location.href = "#userHome";
				}else{
					$('#feedback').html(response.message);
				}
			}else{
				$('#feedback').html(response.message);
			}
		});
	}else{
		var errorstring = errors.join("<br>");
		console.log(errorstring);
		$('#feedback').html(errorstring);
	}
});

function afterLoginCheck(){
	
		
	apikey = localStorage.getItem('apikey');
	full_name = localStorage.getItem('full_name');
	userid = localStorage.getItem('userid');
	
	var workorderstring = localStorage.getItem('workorders');
	if(workorderstring==''){
		workorderlist = [];
	}else{
		workorderlist = workorderstring.split(",");
	}
	
	$('.full_name').html(full_name);
		
}

function updateSchedule(workorderidtoshow, workordernotes, shownotification){
	
	if(isInternet){
		//update records, but only store it for now, let another function actually spit it out
		data = "action=getmyworkorders&apikey="+apikey;
		$.ajax({
			url: apiURL,
			data: data,
			dataType: "json",
			type: 'post'
		}).done(function(response){
			if(response.success){
				var workordersdealtwith = [];
				
				for(var i = 0;i<response.data.total;i++){
					var thisworkorder = response.data.workorders[i];
					var workorderid = thisworkorder.id;
					
					localStorage.setItem('workorder-'+workorderid, JSON.stringify(thisworkorder));
					workordersdealtwith.push(workorderid);
				}
				
				var newworkorderarray = []; 
				
				$.each(workorderlist, function (key, workorderid){
					workorderid = parseInt(workorderid);
					if(workordersdealtwith.indexOf(workorderid)<0){
						//not dealt with, so must be removed, reset field to blank
						localStorage.setItem('workorder-'+workorderid, "");
						
						removeFile(workorderid, 'jobsheet');
						
					}else{
						newworkorderarray.push(workorderid);
					}
				});
				$.each(workordersdealtwith, function (key, workorderid){
					if(newworkorderarray.indexOf(workorderid)<0){
						//not dealt with, must be new, add it to the list of workorders
						newworkorderarray.push(workorderid);
						downloadSafetyDoc(workorderid, false);
						downloadWorkorderJobSheet(workorderid, false);
					}
				});
				
				workorderlist = newworkorderarray;
				var newworkorderstring = newworkorderarray.join(",");
				localStorage.setItem('workorders', newworkorderstring);
				
				if(shownotification){
					showToast("Succesfully updated schedule");
				}
			}else{
				//do nothing if the request didn't work
				showToast("Unable to update schedule: "+response.message);
			}
			refreshSchedulePage(workorderidtoshow, workordernotes, shownotification);
		});
		checkApiKey();
	}else{
		showToast("You are not connected to the internet so this page cannot be updated.  Showing a cached version if available");
		refreshSchedulePage(-1, "", false);
	}
}

var sortdir = 'asc';


function refreshSchedulePage(workorderidwithnote, note, shownotification){
	setLatLon();
	
	//put things onto the page from local schedule
	var workorderstodisplay = [];
	$.each(workorderlist, function(key, workorderid){
		workorderstodisplay.push(JSON.parse(localStorage.getItem('workorder-'+workorderid)));
	});
	if(sortdir=='asc'){
		workorderstodisplay.sort(sortWorkordersDateAsc);
	}else{
		workorderstodisplay.sort(sortWorkordersDateDesc);
	}
	if(workorderstodisplay.length>0){
	
		var output = "";
		$.each(workorderstodisplay, function(key, workorder){
			output += "<div id='page-"+key+"' class='workordercard'>";
			output += "<div class='start_date' id='time-"+workorder.id+"'>"+dateWithoutSeconds(workorder.start_date)+"</div>";
			output += "<div style='float:right;text-align:right'><button class='btn-default downloadworkorderpdf' id='getpdf-"+workorder.id+"'>Job Sheet</button>";
			if(workorder.safety_doc_id!==null && workorder.safety_doc_id!=''){
				output += "<br><button class='btn-default downloadsafetydoc' id='safetydoc-"+workorder.id+"'>Safety Document</button>";
			}
			output += "</div>";
			output += "<div class='workordertype'>Workorder "+ workorder.id;
			output += "<br>"+workorder.workorder_type+" - "+workorder.short_description+"</div>";
			output += "<div class='address'>"+workorder.location_name + '<br>' + workorder.address1 + '<br>' + workorder.city + '<br>' + workorder.postcode +"</div>";
			output += "<div class='withtext'>With: "+workorder.otheremployees.toString().replace(/,/g, ", ") + '</div>';
			output += "<button class='";
			//to enable button, both arrive and depart must be blank
			if(workorder.site_arrive=='' && workorder.site_leave==''){
				output += "arrivebutton";
			}else{
				output += "disabled";
			}
			output += "' id='arrivebtn-"+workorder.id+"'>Arrive</button>";
			output += "<button style='float:right' class='";
			//to enable depart button, arrive time has to be set and depart unset
			if(workorder.site_arrive!='' && workorder.site_leave==''){
				output += "departbutton";
			}else{
				output += "disabled";
			}
			output += "' id='departbtn-"+workorder.id+"'>Depart</button>";
			output += "<div class='row'>";
			output += "<div class='col-sm-6 col-12'><textarea class='engineernotes' id='engineernotes-"+workorder.id+"' placeholder='Add Notes'></textarea></div>";
			output += "<div class='col-sm-6 col-12 pull-right'><button class='submitnotes' id='submitnotes-"+workorder.id+"'>Submit Engineer Notes</button></div>";
			output += "</div>";
			output += "<div class='notesubmitted alert alert-success'";
			if(workorder.id!=workorderidwithnote){
				output += " style='display:none'";
			}
			output += "id='apiresponse-"+workorder.id+"'>";
			if(workorder.id==workorderidwithnote){
				output += note;
			}
			output += "</div>";
			output += "</div>";
		});
		
		$('#schedulerspinner').hide();
		$('#workorderschedulelist').html(output);
		$('#workorderschedulelist').show();
		$('#noworkorders').hide();
	}else{
		
		$('#schedulerspinner').hide();
		$('#workorderschedulelist').hide();
		$('#noworkorders').show();
	}
	
}

function sortWorkordersDateAsc(a, b){
	adate = Date.parse(a.start_date);
	bdate = Date.parse(b.start_date);
	return adate-bdate;
}

function sortWorkordersDateDesc(a,b){
	
	adate = Date.parse(a.start_date);
	bdate = Date.parse(b.start_date);
	return bdate-adate;
}

function setLatLon(){
	navigator.geolocation.getCurrentPosition(geolocationSuccess, geolocationError);
}

var curlat;
var curlon;
function geolocationSuccess(position){
	curlat = position.coords.latitude;
	curlon = position.coords.longitude;
}

function geolocationError(error){
	curlat = -1;
	curlon = -1;
}

$(document).on('click', '.refreshschedule', function(){
	updateSchedule(-1, "", true);
});

$(document).on('click', '.arrivebutton', function(){
	var workorderid = $(this).attr('id').split("-")[1];
	setLatLon();
	
	if(isInternet){
			
		$.ajax({
			type: 'POST',
			url:apiURL,
			data: {
				"action": "setarrivaltime",
				"apikey": apikey,
				"workorderid": workorderid,
				"gpslon": curlon,
				"gpslat": curlat
			},
			dataType: "json",
		}).done(function(response){
			
			if(response.success){
				if(response.data.affected_rows==-1){
					$('#apiresponse-'+workorderid).removeClass('alert-success');
					$('#apiresponse-'+workorderid).addClass('alert-danger');
					$('#apiresponse-'+workorderid).show();
					$('#apiresponse-'+workorderid).html("Unable to update: "+response.error);
				}else{
					updateSchedule(workorderid, "Succesfully set arrival time", false);
				}
			}else{
				$('#apiresponse-'+workorderid).removeClass('alert-success');
				$('#apiresponse-'+workorderid).addClass('alert-danger');
				$('#apiresponse-'+workorderid).show();
				$('#apiresponse-'+workorderid).html("Unable to update: "+response.message);
			}
		});
	}else{
		$('#apiresponse-'+workorderid).removeClass('alert-success');
		$('#apiresponse-'+workorderid).addClass('alert-danger');
		$('#apiresponse-'+workorderid).show();
		$('#apiresponse-'+workorderid).html("Unable to connect to API, please check your internet connection");
	}
});

$(document).on('click', '.departbutton', function(){
	var workorderid = $(this).attr('id').split("-")[1];
	setLatLon();
	
	if(isInternet){
			
		$.ajax({
			type: 'POST',
			url:apiURL,
			data: {
				"action": "setleavetime",
				"apikey": apikey,
				"workorderid": workorderid,
				"gpslon": curlon,
				"gpslat": curlat,
				"notes": $('#engineernotes-'+workorderid).val()
			},
			dataType: "json",
		}).done(function(response){
			
			if(response.success){
				if(response.data.affected_rows==-1){
					$('#apiresponse-'+workorderid).removeClass('alert-success');
					$('#apiresponse-'+workorderid).addClass('alert-danger');
					$('#apiresponse-'+workorderid).show();
					$('#apiresponse-'+workorderid).html("Unable to update: "+response.error);
				}else{
					updateSchedule(workorderid, "Successfully set departure time", false);
				}
			}else{
				$('#apiresponse-'+workorderid).removeClass('alert-success');
				$('#apiresponse-'+workorderid).addClass('alert-danger');
				$('#apiresponse-'+workorderid).show();
				$('#apiresponse-'+workorderid).html("Unable to update: "+response.message);
			}
		});
	}else{
		$('#apiresponse-'+workorderid).removeClass('alert-success');
		$('#apiresponse-'+workorderid).addClass('alert-danger');
		$('#apiresponse-'+workorderid).show();
		$('#apiresponse-'+workorderid).html("Unable to connect to API, please check your internet connection");
	}
});

$(document).on('click', '.submitnotes', function(){
	var workorderid = $(this).attr('id').split("-")[1];
	
	if(isInternet){
			
		$.ajax({
			type: 'POST',
			url:apiURL,
			data: {
				"action": "updateengineernotes",
				"apikey": apikey,
				"workorderid": workorderid,
				"notes": $('#engineernotes-'+workorderid).val()
			},
			dataType: "json",
		}).done(function(response){
			
			if(response.success){
				if(response.data.affected_rows==-1){
					$('#apiresponse-'+workorderid).removeClass('alert-success');
					$('#apiresponse-'+workorderid).addClass('alert-danger');
					$('#apiresponse-'+workorderid).show();
					$('#apiresponse-'+workorderid).html("Unable to update: "+response.error);
				}else{
					updateSchedule(workorderid, "Succesfully set note", false);
				}
			}else{
				$('#apiresponse-'+workorderid).removeClass('alert-success');
				$('#apiresponse-'+workorderid).addClass('alert-danger');
				$('#apiresponse-'+workorderid).show();
				$('#apiresponse-'+workorderid).html("Unable to update: "+response.message);
			}
		});
	}else{
		$('#apiresponse-'+workorderid).removeClass('alert-success');
		$('#apiresponse-'+workorderid).addClass('alert-danger');
		$('#apiresponse-'+workorderid).show();
		$('#apiresponse-'+workorderid).html("Unable to connect to API, please check your internet connection");
	}
});




/* File handling functions */
$(document).on('click', '.downloadworkorderpdf', function(){
	var workorderid = $(this).attr('id').split("-")[1];
	checkInternet();
	
	downloadWorkorderJobSheet(workorderid, true);
});

function downloadWorkorderJobSheet(workorderid, openfile){
	
	if(isInternet){
		var pdfurl = siteURL+"/workordertopdf.php?workorderid="+workorderid+"&apikey="+apikey
		
		try{
			window.requestFileSystem(LocalFileSystem.PERSISTENT, 20 * 1024 * 1024, function (fs) {

					// Parameters passed to getFile create a new file or return the file if it already exists.
					fs.root.getFile("workorder-jobsheet-"+workorderid+".pdf", { create: true, exclusive: false }, function (fileEntry) {
							download(fileEntry, pdfurl, true, workorderid, 'jobsheet', openfile);

					}, onErrorCreateFile);

			}, onErrorLoadFs);
			
		}catch(error){
			alert("Error code LF3: "+JSON.stringify(error));
		}
	}else{
		readFile(workorderid, 'jobsheet');
	}
}

/* File handling functions */
$(document).on('click', '.downloadsafetydoc', function(){
	var workorderid = $(this).attr('id').split("-")[1];
	checkInternet();
	downloadSafetyDoc(workorderid, true);
});

function downloadSafetyDoc(workorderid, openfile){
	
	if(isInternet){
		var pdfurl = siteURL+"/downloadfile.php?type=safety&workorderid="+workorderid+"&apikey="+apikey;
		
		try{
			window.requestFileSystem(LocalFileSystem.PERSISTENT, 20 * 1024 * 1024, function (fs) {

					// Parameters passed to getFile create a new file or return the file if it already exists.
					fs.root.getFile("workorder-safety-"+workorderid+".pdf", { create: true, exclusive: false }, function (fileEntry) {
							download(fileEntry, pdfurl, true, workorderid, 'safety', openfile);

					}, onErrorCreateFile);

			}, onErrorLoadFs);
			
		}catch(error){
			alert("Error code LF2: "+JSON.stringify(error));
		}
	}else{
		readFile(workorderid, 'safety');
	}
}

function onErrorLoadFs(error){
	alert("Error code LF1: "+JSON.stringify(error));
}

function onErrorCreateFile(error){
	alert("Error code CF1: "+JSON.stringify(error));
}

function download(fileEntry, uri, readBinaryData, workorderid, type, openfile) {
	
	if(isInternet){
		var fileTransfer = new FileTransfer();
		var fileURL = fileEntry.toURL();
		fileTransfer.download(
			uri,
			fileURL,
			function (entry) {
				localStorage.setItem('workorder-'+type+'-'+workorderid, entry.toURL());
				if(openfile){
					readFile(workorderid, type);
				}
			},
			function (error) {
				alert("Error code D1: "+JSON.stringify(error));
			},
			null, // or, pass false
			{
				//headers: {
				//    "Authorization": "Basic dGVzdHVzZXJuYW1lOnRlc3RwYXNzd29yZA=="
				//}
			}
		);
	}else{
		//don't download anything if there is no internet connection
	}
}

function readFile(workorderid, type){
	var path = localStorage.getItem('workorder-'+type+'-'+workorderid);
	
	if(path!==null && path!=''){
		try{
			
			cordova.plugins.fileOpener2.open(
					path, 
					'application/pdf', 
					{
							error : function(error){
								cannotOpenFile(workorderid, 'Error opening file on filesystem 1: '+ error);
							}, 
							success : function(){ } 
					} 
			);
		}catch(error){
			cannotOpenFile(workorderid, 'Error opening file on filesystem 2:'+error);
		}
	}else{
		cannotOpenFile(workorderid, 'The file cannot be downloaded and has not been previously stored.  You will need to connect to the internet to view the file');
	}
}

function cannotOpenFile(workorderid, message){
	$('#apiresponse-'+workorderid).removeClass('alert-success');
	$('#apiresponse-'+workorderid).addClass('alert-danger');
	$('#apiresponse-'+workorderid).show();
	$('#apiresponse-'+workorderid).html(message);
}

function removeFile(workorderid, type){
	var path = localStorage.getItem('workorder-'+type+'-'+workorderid);
	if(path!==null && path!=''){
		try{
			window.requestFileSystem(LocalFileSystem.PERSISTENT, 20*1024*1024, function(fs) {
				fs.root.getFile("workorder-"+type+"-"+workorderid+".pdf", {create: false}, function(fileEntry) {
					try{
						fileEntry.remove(function() {
							if(type=='jobsheet'){
								//file removal run asynchronously so this needs to be chained together
								removeFile(workorderid, 'safety');
							}
						}, removeFileErrorHandler3);
					}catch(error){
						alert("Error code RM4: "+error);
					}
				}, removeFileErrorHandler1);
			}, removeFileErrorHandler2);
		}catch(error){
			alert("Error code RM5:"+JSON.stringify(error));
		}
	}else{
		//continue chain
		if(type=='jobsheet'){
			//file removal run asynchronously so this needs to be chained together
			removeFile(workorderid, 'safety');
		}
	}
	localStorage.setItem('workorder-'+type+'-'+workorderid, '');
}

function errorHandler(error){alert("Error code E1:"+JSON.stringify(error))}
function removeFileErrorHandler1(error){alert("Error code RM1:"+JSON.stringify(error));}
function removeFileErrorHandler2(error){alert("Error code RM2:"+JSON.stringify(error));}
function removeFileErrorHandler3(error){alert("Error code RM3:"+JSON.stringify(error));}


/* Expenses page */
scheduleformenabled = false;
function populateExpensesForm(shownotification){
	enableform = true;
	
	if(isInternet){
	
		var data = "action=getcodes&codetype=Receipt Payment Method&apikey="+apikey;
		var paymentmethods = "<option value=''></option>";
		var expensestypes = "<option value=''></option>";
		
		$.ajax({
			url: apiURL,
			data: data,
			dataType: "json",
			type: 'post'
		}).done(function(response){
			if(response.success){
				$.each(response.data, function(key, value){
					paymentmethods += "<option value='"+key+"'>"+value+"</option>";
				});
				$('#expensepaymentmethod').html(paymentmethods);
				$('#expensepaymentmethod').trigger('change');
				
				data = "action=getcodes&codetype=Receipt Type&apikey="+apikey;
				$.ajax({
					url: apiURL,
					data: data,
					dataType: "json",
					type: 'post'
				}).done(function(response){
					if(response.success){
						$.each(response.data, function(key, value){
							expensestypes += "<option value='"+key+"'>"+value+"</option>";
						});
						$('#expensetype').html(expensestypes);
						$('#expensetype').trigger('change');
						
						//enable the form now
						scheduleformenabled = true;
						$('#submitexpensesbutton').removeClass("ui-state-disabled");
						$('#submitexpensesbutton2').removeClass("ui-state-disabled");
						
						if(shownotification){
							showToast("Succesfully updated form");
						}
					}
				});
			}
		});
		
	}else{
		showToast("Unable to connect to the API.  You need to be connected to the internet in order to submit expense claims");
	}
}

$(document).on('click', '#refreshexpenses', function(e){
	e.preventDefault();
	populateExpensesForm(true);
});

$(document).on('click', '.submitexpensesbutton:not(.ui-state-disabled)', function(e){
	e.preventDefault();
	checkInternet();
	
	if(isInternet){
		$('#expenseformresult').removeClass('alert-danger');
		$('#expenseformresult').removeClass('alert-success');
		$('#expenseformresult').hide();
		
		$('#expensedatediv').removeClass('failedform');
		$('#expensetypediv').removeClass('failedform');
		$('#expensepaymentmethoddiv').removeClass('failedform');
		$('#expenseamountdiv').removeClass('failedform');
		
		var expensedate = $('#expensedate').val();
		var expensetype = $('#expensetype').val();
		var expensepaymentmethod = $('#expensepaymentmethod').val();
		var expenseamount = $('#expenseamount').val();
		var base64encode = $('#receiptphoto').attr('src');
		
		var goodform = true;
		var errors = [];
		
		if(expensedate==''){
			goodform = false;
			errors.push("The date the expense was made must be set");
			$('#expensedatediv').addClass('failedform');
		}
		
		if(expensetype==''){
			goodform = false;
			errors.push("You need to select an expense type");
			$('#expensetypediv').addClass('failedform');
		}
		
		if(expensepaymentmethod==''){
			goodform = false;
			errors.push("You need to select a payment type");
			$('#expensepaymentmethoddiv').addClass('failedform');
		}
		
		if(expenseamount==''){
			goodform = false;
			errors.push("The amount needs to be entered");
			$('#expenseamountdiv').addClass('failedform');
		}
		
		if(base64encode==''){
			goodform = false;
			errors.push("You need to take a photo of the receipt or other documentation");
			$('#receiptphotodiv').addClass('failedform');
		}
		
		if(goodform){
			$('#expensesspinnerdiv').show();
			
			$('#submitexpensesbutton').addClass('ui-state-disabled');
			$('#submitexpensesbutton2').addClass('ui-state-disabled');
			$.ajax({
				type: 'POST',
				url:apiURL,
				data: {
					"action": "uploadreceipt",
					"apikey": apikey,
					"receipt_date": expensedate,
					"payment_type": expensetype,
					"payment_method": expensepaymentmethod,
					"amount": expenseamount,
					"base64encode": base64encode
				},
				dataType: "json",
			}).done(function(response){
				
				$('#expensedate').val('');
				$('#expensetype').val('');
				$('#expensepaymentmethod').val('');
				$('#expenseamount').val('');
				$('#expensepaymentmethod').trigger('change');
				$('#expensetype').trigger('change');
				$('#receiptphoto').attr('src', '');
				$('#receiptphotodiv').hide();
				
				$('#expensesspinnerdiv').hide();
				$('#submitexpensesbutton').removeClass('ui-state-disabled');
				$('#submitexpensesbutton2').removeClass('ui-state-disabled');
				
				$('#expenseformresult').addClass('alert-success');
				$('#expenseformresult').html("Succesfully uploaded expense claim");
				$('#expenseformresult').slideDown();
			}).fail(function(error){
				$('#expensesspinnerdiv').hide();
				$('#expenseformresult').addClass('alert-fail');
				$('#expenseformresult').html("Unable to submit expense: <br>"+JSON.stringify(error));
				$('#expenseformresult').slideDown();
			});
		}else{
			$('#expenseformresult').addClass('alert-danger');
			$('#expenseformresult').html(errors.join("<br>"));
			$('#expenseformresult').slideDown();
		}
	}else{
		showToast("Unable to connect to the API, you need to be connected to the internet to upload expense photos");
	}
		
});

$(document).on('click', '#getphotobutton', function(e){
	e.preventDefault();
	
	navigator.camera.getPicture(function(imageData){
			//on success
			$('#receiptphoto').attr('src', "data:image/jpeg;base64," + imageData);
			$('#receiptphotodiv').show();
		}, function(message){
			//on fail
			alert('Get photo failed because: ' + message);
		}, 
		{ 
			quality: 50, 
			destinationType: Camera.DestinationType.DATA_URL
		}); 
});



function onCameraSuccess(imageURI) {
	var image = document.getElementById('myImage');
	image.src = imageURI;
}

function onCameraFail(message) {
	
}


function dateWithoutSeconds(date){
	return date.substring(0, date.length - 3);
}

$(document).on('click', '#logout', function(e){
	e.preventDefault();
	
	resetAllFields();
	window.location.href='#login';
});

//Page change listener - calls functions to make this readable. NB due to the way the "pages" are loaded we cannot put this inside the document ready function.
$(document).on( "pagecontainerchange", function( event, ui ) {

	switch (ui.toPage.prop("id")) {
		case "userHome":
			checkIfLoggedIn(true, 'userHome');
			updateSchedule(-1, '', false);
			break;
		case "schedulePage":
			checkIfLoggedIn(true, 'schedulePage');
			updateSchedule(-1, "", false);
			break;
		case "login":
			checkIfLoggedIn(false, '');
			break;
		case "expensesPage":
			checkIfLoggedIn(true, 'expensesPage');
			populateExpensesForm(false);
			break;
		default:
			console.log("NO PAGE INIT FUNCTION")
			break;
	}
});


function hide_div(div_id) {   
	document.getElementById(div_id).classList.toggle("hide");
}

function toggle_content(current, alternative) { 
	hide_div(current);
	hide_div(alternative);
}


function resetAllFields(){
	$('#username').html('');
	$('#password').html('');
	$('#full_name').html('');
	
	var workorders = localStorage.getItem('workorders');
	var workorderlist = workorders.split(",");
	for(var i = 0;i<workorderlist.length;i++){
		var workorderid = workorderlist[i];
		removeFile(workorderid);
	}
	
	setTimeout(function(){
		localStorage.clear();
	}, 200); //wait 200ms before clearing the cache
}




//List files code and put into a div with id filelist
function updateFileList(){
	try{
		$('#filelist').html('');
		window.requestFileSystem(LocalFileSystem.PERSISTENT, 20*1024*1024, onInitFs, errorHandler);
	}catch(error){
		alert("Error code FL1:"+error.toString());
	}
}

function toArray(list) {
	return Array.prototype.slice.call(list || [], 0);
}

function listResults(entries) {
	// Document fragments can improve performance since they're only appended
	// to the DOM once. Only one browser reflow occurs.
	var fragment = document.createDocumentFragment();

	entries.forEach(function(entry, i) {
		var img = entry.isDirectory ? '<img src="folder-icon.gif">' :
																	'<img src="file-icon.gif">';
		var li = document.createElement('li');
		li.innerHTML = [img, '<span>', entry.name, '</span>'].join('');
		fragment.appendChild(li);
	});

	document.querySelector('#filelist').appendChild(fragment);
}

function onInitFs(fs) {

	var dirReader = fs.root.createReader();
	var entries = [];

	// Call the reader.readEntries() until no more results are returned.
	var readEntries = function() {
		 dirReader.readEntries (function(results) {
			if (!results.length) {
				listResults(entries.sort());
			} else {
				entries = entries.concat(toArray(results));
				readEntries();
			}
		}, errorHandler);
	};

	readEntries(); // Start reading dirs.

}

