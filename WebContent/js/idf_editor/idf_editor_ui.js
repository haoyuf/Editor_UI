/**
 * Helper JavaScript method for UI
 */

var draggingTab;
var draggingID;

function onDragStart(ev){	
	$("#layoutPosition").show();
	draggingTab = $(this).parent().attr("href");
	draggingID = $(this).parent().parent().attr("id");
	$(".edit").hide();
}

$("#layoutPosition div")
	.on("dragenter", onDragEnter)
	.on("dragover", onDragOver)
	.on("dragleave", onDragLeave)
	.on("drop", onDrop);

function onDragEnter(event){
	event.preventDefault();
	$(this).addClass("ableDrop");
}

function onDragOver(event){
	event.preventDefault();
	if(!$(this).hasClass("ableDrop"))
		$(this).addClass("ableDrop");
}

function onDragLeave(event) {
	event.preventDefault();
	$(this).removeClass("ableDrop");
}

function onDrop(event){
	event.preventDefault();
	$(this).removeClass("ableDrop");
	
	blockFrom = $(draggingTab).parent().parent().attr("id");
	console.log(blockFrom);
	if((blockFrom === "MainTab" && $(this).hasClass("left"))
	   ||(blockFrom === "RightTab" && $(this).hasClass("right"))
	   ||(blockFrom === "BottomTab" && $(this).hasClass("bottom"))){
		console.log("1to1");
	}
	else{
		if($(this).hasClass("left")){
			$("#MainTab ul").append($("#"+draggingID));
			$("#MainTab div.tab-content").append($(draggingTab));
			
			$("#MainTab ul").children().removeClass("active");
			$("#MainTab div.tab-content div").removeClass('active');
			$("#MainTab ul").children().last().addClass('active');
			$("#MainTab div.tab-content").children().last().addClass('active');
		}
		else if($(this).hasClass("right")){

			$("#RightTab ul").append($("#"+draggingID));
			$("#RightTab div.tab-content").append($(draggingTab));
			
			$("#RightTab ul").children().removeClass("active");
			$("#RightTab div.tab-content div").removeClass('active');
			$("#RightTab ul").children().last().addClass('active');
			$("#RightTab div.tab-content").children().last().addClass('active');
		}
		else if($(this).hasClass("bottom")){

			$("#BottomTab ul").append($("#"+draggingID));
			$("#BottomTab div.tab-content").append($(draggingTab));
			
			$("#BottomTab ul").children().removeClass("active");
			$("#BottomTab div.tab-content div").removeClass('active');
			$("#BottomTab ul").children().last().addClass('active');
			$("#BottomTab div.tab-content").children().last().addClass('active');
		}
		$("#"+blockFrom+" ul").children().removeClass('active');
		$("#"+blockFrom+" div.tab-content").children().removeClass('active'); // Select first tab
		$("#"+blockFrom+" ul").children().last().addClass('active');
		$("#"+blockFrom+" div.tab-content").children().last().addClass('active'); // Select first tab
		
	}
	if($("#RightTab ul").children().length != 0){
			$("#MainTab").attr("style","width:calc(50% - 10px);");
			
		}
	else{
		$("#MainTab").attr("style","width:100%;");
	}
	$("#layoutPosition").hide();
	$(".edit").show();
}

function tabClose(){
	//there are multiple elements which has .closeTab icon so close the tab whose close icon is clicked
	var tabContentId = $(this).prev().attr("href");
	var blockID=$(this).parent().parent().parent().attr("id");
	
	if($(this).parent().hasClass("active")){
		$(this).parent().remove(); //remove li of tab	
		$(tabContentId).remove(); //remove respective tab content
		
		$("#"+blockID+" ul").first().children().removeClass("active");
		$("#"+blockID+" div.tab-content div").removeClass('active');
		$("#"+blockID+" ul").children().last().addClass('active');
		$("#"+blockID+" div.tab-content").children().last().addClass('active'); // Select first tab
	}
	else{
		$(this).parent().remove(); //remove li of tab	
		$(tabContentId).remove(); //remove respective tab content
	}

	if($("#RightTab ul").children().length != 0){
		$("#MainTab").attr("style","width:calc(50% - 10px);");				
	}
	else{
		$("#MainTab").attr("style","width:100%;");
	}
	
	if(idf_editor.state.curMode === idf_editor.mode_options.text_edit){
/*		var leafId = tabContentId.substring(5);
		idf_editor.removeTextEditor(leafId);*/
		
		if($("#MainTab ul").children().length + $("#RightTab ul").children().length == 0){
			$("#instructionHolder").hide();
		}
		
	}
}


//-----------------------event handler---------------------

/*var on = function(emitter, type, f) {
	  if (emitter.addEventListener) {
	    emitter.addEventListener(type, f, false);
	  } else if (emitter.attachEvent) {
	    emitter.attachEvent("on" + type, f);
	  } else {
	    var map$$1 = emitter._handlers || (emitter._handlers = {});
	    map$$1[type] = (map$$1[type] || noHandlers).concat(f);
	  }
	};*/
	
//----------------------event handler-----------------------

