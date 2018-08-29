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
		if(resfreshcount%60==0){
			setLatLon();
		}
	}, 10000);
	
	setTimeout(checkIfLoggedIn, 20);
	
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
var isInternet = true;
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

function checkIfLoggedIn(requirelogin){
	loggedIn = localStorage.getItem('loggedIn');
	
	if(requirelogin && loggedIn!='1'){
		window.location.href='#login';
		
	}else if(!requirelogin && loggedIn=='1'){
		
		afterLoginCheck();
		
		window.location.href='#userHome';
		
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

function updateSchedule(){
	
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
					}else{
						newworkorderarray.push(workorderid);
					}
				});
				$.each(workordersdealtwith, function (key, workorderid){
					if(newworkorderarray.indexOf(workorderid)<0){
						//not dealt with, must be new, add it to the list of workorders
						newworkorderarray.push(workorderid);
					}
				});
				
				workorderlist = newworkorderarray;
				var newworkorderstring = newworkorderarray.join(",");
				localStorage.setItem('workorders', newworkorderstring);
			}else{
				//do nothing if the request didn't work
			}
			refreshSchedulePage();
		});
	}else{
		refreshSchedulePage();
	}
}

function refreshSchedulePage(){
	//put things onto the page from local schedule
	var workorderstodisplay = [];
	$.each(workorderlist, function(key, workorderid){
		workorderstodisplay.push(JSON.parse(localStorage.getItem('workorder-'+workorderid)));
	});
	workorderstodisplay.sort(sortWorkordersDateAsc);
	console.log(workorderstodisplay);
	
	setLatLon();
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
	curlon = position.coords.longiture;
}

function geolocationError(error){
	curlat = -1;
	curlon = -1;
}

$(document).on('click', '.refreshschedule', function(){
	updateSchedule();
});

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
			checkIfLoggedIn(true);
			break;
		case "schedulePage":
			checkIfLoggedIn(true);
			updateSchedule();
			break;
		case "login":
			checkIfLoggedIn(false);
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
	
	localStorage.clear();
}

