debug = true;
MAX_SEARCH = 400;
DEFALT_LOADREPEAT = 8;
loadrepeat_count = 0;
fetch_mode = 'N/A';
currentIndex = 0;
numDates = 21;

$(window).keydown(function(e){
/*  if(e.keyCode==38 && e.shiftKey){
  	moveUp();
  }else if(e.keyCode==40  && e.shiftKey){
  	moveDown();
  }else*/ if(e.keyCode == 75){
  	moveUp();
  }else if(e.keyCode==74){
  	moveDown();
  }

});

function moveUp(){
	currentIndex -= 1;
	if(currentIndex<0)
		currentIndex = 0;
	else
		jumpToIndex(currentIndex);
}

function moveDown(){
	currentIndex += 1;
	if(currentIndex>=numDates)
		currentIndex = numDates-1;
	else
		jumpToIndex(currentIndex);
}


function keys(object) {
	var results = [];
	for (var property in object){
		results.push(property);
	}
	return results;
}

function mydebug(msg){
	if(debug)	console.log(msg);
}

function findSerialTweets(json){
	var count = 0;
	var indices = new Array(MAX_SEARCH);
	for(var i=0;i<json.length;i++){
		var isSerial = json[i].text.match(/^(.{2})（[１２３４５６７８９123456789]）/) || json[i].text.match(/連続ツイート第(.+)回「(.+)」/);
		if(isSerial){
			indices[count]=i;
			count++;
		}	
	}
	var ret = new Array(count);
	return indices;
}

fontSizeIndex = 2;
fontSize = ['55%','75%','100%','120%','150%'];
function fontSizeChange(size){
	fontSizeIndex += size;
	fontSizeIndex = Math.max(Math.min(fontSizeIndex,fontSize.length-1),0);
	$('#contents').css('font-size', fontSize[fontSizeIndex]);
}

function picOnOff(flag){
	if(flag)
		$('#mogipic').addClass('pic_visible');
	else
		$('#mogipic').removeClass('pic_visible');
}

//茂木氏が常に日本に居ると仮定
function getDate(str){
	var timediff = 9;	//This is Japan!
	str.match(/(\d{4})$/);
	var date = new Date(str);
	var dateJp = new Date(date.getYear(),date.getMonth(),date.getDate(),
		date.getHours()+date.getTimezoneOffset()/60+timediff,date.getMinutes(),date.getSeconds());
	var ret = [parseInt(RegExp.$1),dateJp.getMonth()+1,dateJp.getDate()];
	if(ret[1]==1&&ret[2]==1){
		ret[0]=ret[0]+1;	//Ad hoc. I don't know why the code above does not work.
	}
	return ret;
}

function formatDate(date){
	return ""+date[1]+"月"+date[2]+"日";
}

widetonarrow = {"１":"01","２":"02","３":"03","４":"04","５":"05",
"６":"06","７":"07","８":"08","９":"09","１０":"10"};

function dateNum(num){
	var ret;
	if(num<10)
		ret = "0"+num;
	else
		ret = ""+num;
	return ret;
}

function jsonKeyMake(date,text){
	text.match(/^(.+)（([１２３４５６７８９０]{1,2})）/);
	return dateNum(date[0])+dateNum(date[1])+dateNum(date[2])+widetonarrow[RegExp.$2];
}

function saveData(date,json){
	saveid = parseInt(json.id);
	if(saved_max_id == -1 || saveid>saved_max_id){
		saved_max_id=saveid;
	}else if(saved_min_id == -1 || saveid<saved_min_id){
		saved_min_id=saveid;
	}
	localStorage['savedIdRange']=""+saved_min_id+","+saved_max_id;
	var key = jsonKeyMake(date,json.text);
	if(localStorage[key]==null){
		localStorage[key]=JSON.stringify(json);
		if(!localStorage.tweetkeys)
			localStorage['tweetkeys'] = ""+key;
		else
			localStorage['tweetkeys'] += ","+key;
	}
}

function callBackJson(json){
	mydebug(""+json.length+" "+fetch_mode+" tweets were downloaded");
	var indices = findSerialTweets(json);
	for(i=0;i<json.length;i++){
		if(indices.indexOf(i)!=-1){
			date = getDate(json[i].created_at);
			saveData(date,json[i]);
		}
	}
	loadrepeat_count += 1;
	setResetProgress(loadrepeat_count / DEFALT_LOADREPEAT * 100);
	if(loadrepeat_count<DEFALT_LOADREPEAT){
		if(fetch_mode=="new")
			loadNewTweets();
		else if(fetch_mode=="old")
			loadOlderTweets();
	}else{
		$('#prog-container').css('visibility','hidden');
		setResetProgress(0);
		loadrepeat_count = 0;
		showTweets();
	}
}

function updateTweetListData(){
	var k = localStorage['tweetkeys'];
	if(k!=null)
		alltweetkeys = localStorage['tweetkeys'].split(",").sort();
	else
		alltweetkeys = [];
}

function makeDateList(num_days){
	updateTweetListData();
	var count = 0;
	var list = new Array(100);
	for(var i=0;i<list.length;i++){
		list[i] = new Array(3);
	}
	var prev_date = 30000000; 
	for(i=alltweetkeys.length-1;i>=0;i--){
		var date=parseInt(alltweetkeys[i].slice(0,8));
		if(date<prev_date){
			list[count][0] = Math.floor(date/10000);
			list[count][1] = Math.floor(date/100) % 100;
			list[count][2] = date % 100;
			count++;
			if(num_days==count) break;
		}
		prev_date = date;
	}
	var ret = new Array(count);
	for(i=0;i<count;i++){
		ret[i] = new Array(3);
		ret[i][0] = list[i][0];
		ret[i][1] = list[i][1];
		ret[i][2] = list[i][2];
	}
	return ret;
}

function jumpToIndex(i){
	currentIndex = i;
	var d_list = makeDateList(21);
	jumpToDate(d_list[i]);
}

function calcIndex(date){
	var datestr= ""+(date[0]*10000+date[1]*100+date[2]);
	var ps = $('p','#dates');
	var found = -1;
	var pss = ps.get();
	for(var i =0;i<ps.length;i++){
		var id = pss[i].id;
		mydebug(id, datestr);
		if(id==datestr){
			fount = i;
			break
		}
		i += 1;
	}
	mydebug('calcIndex: '+date + found);
	return found;
}

function jumpToDate(date){
	var tw_selected = new Array();
	var datestr= ""+(date[0]*10000+date[1]*100+date[2]);
	for(var i=0;i<alltweetkeys.length;i++){
		if(alltweetkeys[i].slice(0,8)==datestr)
		tw_selected.push(alltweetkeys[i]);
	}
	$('li','#dates').removeClass('selecteddate');
	$('#'+datestr).addClass('selecteddate');
	var text = new Array();
	var number;
	var title;
	var shorttitle; 
	for(i=0;i<tw_selected.length;i++){
		var json = JSON.parse(localStorage[tw_selected[i]]);
		if(json.text.match(/^(.{0,3})（[１２３４５６７８９]）(.+)$/)){
			text.push(RegExp.$2);
			shorttitle = RegExp.$1;
		}
		if(json.text.match(/連続ツイート第(.+)回「(.+?)」/)){
			number = RegExp.$1;
			title = RegExp.$2;
		}
	}
	var tw_content = "<p class='date'>"+formatDate(date)+"&nbsp;"+shorttitle+"（"+ number +"）<i>"+title +"</i></p>";
	for(i in text){	
		tw_content += "<div class='tweet' id='tweet"+i+"'>"+text[i]+"</div>";
		+"<span id='date'>"+formatDate(getDate(json.created_at))+"</span></p>";
	}

	$('#twitter').html(tw_content);
	showTweetsAnimate();
	window.scrollBy(0,0); 
}

var timerId = undefined;
function showTweetsAnimate(){
	counter = 0;
	if(timerId)
		clearInterval(timerId);
	timerId = setInterval(function(){
		mydebug('timer called.')
		mydebug('div.tweet#tweet'+counter);
		$('div.tweet#tweet'+counter).css('opacity','1');
		counter += 1;
		if(counter>8)
			clearInterval(timerId);
	},80);
	heightone = $('.selecteddate').outerHeight(true);
	offset = -($('#navigation ul').height() - heightone)/ 2;
	mydebug('Height of a li element: '+heightone);
	$('#navigation ul').animate({scrollTop: heightone*currentIndex+offset},100,'swing')
}

function showTweets(){
	var d_list = makeDateList(numDates);
	var d_content = "<ul id='dates' class='fade'>";
	for(var i=0;i<d_list.length;i++){
		var datestr = ""+(d_list[i][0]*10000+d_list[i][1]*100+d_list[i][2]);
		d_content += "<li class='dateentry' id='"+datestr+"'><a href='javascript:jumpToIndex("+i+")'>"+formatDate(d_list[i])+"</a></li>\n";
	}
	d_content += '</ul>'
	$('#dates').html(d_content);
	jumpToDate(d_list[0]);
	currentIndex = 0;
	mydebug("IDs from "+saved_min_id+" to "+saved_max_id+" are saved in the cache. "+alltweetkeys.length+" tweets are in cache as serial tweets.");
}

function loadTwitter(){
	if(saved_min_id==-1){
		fetch_mode = "old";
		$('#prog-container').css('visibility','visible');
		mydebug("Calling $.getJSON()…");
		$.getJSON("http://twitter.com/statuses/user_timeline/kenichiromogi.json?"+
			"callback=?&count=200&include_rts=false&exclude_replies=true",callBackJson);
	}else{
		showTweets();
	}
}

function loadOlderTweets(){
	fetch_mode = "old";
	if(saved_min_id!=-1){
		mydebug("Calling $.getJSON()…");
		$.getJSON("http://twitter.com/statuses/user_timeline/kenichiromogi.json?"+
		"callback=?&count=200&include_rts=false&exclude_replies=true&max_id="+saved_min_id,callBackJson);
	}
}

function loadNewTweets(){
	if(saved_min_id!=-1){
		fetch_mode = "new";
		mydebug("Calling $.getJSON()…");
		$.getJSON("http://twitter.com/statuses/user_timeline/kenichiromogi.json?"+
		"callback=?&count=200&include_rts=false&exclude_replies=true&since_id="+saved_max_id,callBackJson);
	}else{
		fetch_mode = "old";
		mydebug("Calling $.getJSON()…");
		$.getJSON("http://twitter.com/statuses/user_timeline/kenichiromogi.json?"+
		"callback=?&count=200&include_rts=false&exclude_replies=true",callBackJson);
	}
}

function clearCache(){
	localStorage.clear();
	saved_min_id = -1;
	saved_max_id = -1;
	loadrepeat_count = 0;
	mydebug("Cache was cleared.");
	loadTwitter();
}

function initialize(){
	fetch_mode = "N/A";
	var range = localStorage['savedIdRange'];
	if(range != null){
		ids = range.split(",");
		saved_min_id = ids[0];
		saved_max_id = ids[1];
	}else{
		saved_min_id = -1;
		saved_max_id = -1;
	}
	loadTwitter();
}

$(function(){
window.applicationCache.update();
Stroll.bind('#navigation ul');
var cache = window.applicationCache;
cache.addEventListener("updateready", function() {
    if (confirm('New version available. Do you want to update now?')) {
        cache.swapCache();
        location.reload();
    }
});
if (navigator.onLine) {
    cache.update();
}});


function setResetProgress(percent){
	$('#reset-progress').width(''+percent+'%');
}

