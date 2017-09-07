/**
 *  //This function will be redesignd in the future when idf_server is built
 *  //This is only for temporary enhancement
 */


var IDF_TOOLTIPSERVICE = (function(){
	var cm = null; //codeMirror instance
	var mousePos = null;
	
	function loadEditor(editor){
		cm = editor;
	}
				
	
	function getError(){
		var tokenState = cm.getTokenAt(cm.getCursor());
		return tokenState.state.errors[tokenState.state.errors.length - 1];
	}
	
	function getTipContent(queryName){
		if(queryName == "error"){
			return getError();
		}
	}
		
	function showContextInfo(cm, queryName, c) {
	    var tip = elt("span", null, elt("strong", null));	 
	    var tipContent = getTipContent(queryName);
	    tip.appendChild(document.createTextNode(tipContent));
	    tempTooltip(cm, tip);
	    if(c) c();
	}
		
		
		// create temporary tooltip
	function tempTooltip(cm, content) {	   
	    var where = cm.cursorCoords();
	    var tip = makeTooltip(where.right + 1, where.bottom, content);
	    function maybeClear() {
	      old = true;
	      if (!mouseOnTip) clear();
	    }
	    function clear() {
	      if (tip.parentNode) fadeOut(tip)
	      clearActivity()
	    }
	    var mouseOnTip = false, old = false;
	    CodeMirror.on(tip, "mousemove", function() { mouseOnTip = true; });
	    CodeMirror.on(tip, "mouseout", function(e) {
	      if (!CodeMirror.contains(tip, e.relatedTarget || e.toElement)) {
	        if (old) clear();
	        else mouseOnTip = false;
	      }
	    });
	    setTimeout(maybeClear, 1700);
	    var clearActivity = onEditorActivity(cm, clear)
	}
	
	
	  function onEditorActivity(cm, f) {
		    cm.on("cursorActivity", f)
		    cm.on("blur", f)
		    cm.on("scroll", f)
		    cm.on("setDoc", f)
		    return function() {
		      cm.off("cursorActivity", f)
		      cm.off("blur", f)
		      cm.off("scroll", f)
		      cm.off("setDoc", f)
		    }
		  }
	  
	  var cls = "CodeMirror-Tern-";	  
	  function makeTooltip(x, y, content) {
		    var node = elt("div", cls + "tooltip", content);
		    node.style.left = x + "px";
		    node.style.top = y + "px";
		    document.body.appendChild(node);
		    return node;
		  }
	  
	  function fadeOut(tooltip){
		  tooltip.style.opacity = "0";
		  setTimeout(function() { remove(tooltip); }, 1100);
	  }
	  
	  function remove(node){
		  var p = node && node.parentNode;
		  if(p) p.removeChild(node);
	  }
	  
	  function elt(tagname, cls /*, ... elts*/) {
		    var e = document.createElement(tagname);
		    if (cls) e.className = cls;
		    for (var i = 2; i < arguments.length; ++i) {
		      var elt = arguments[i];
		      if (typeof elt == "string") elt = document.createTextNode(elt);
		      e.appendChild(elt);
		    }
		    return e;
		  }
	  
	  return {
		  showContextInfo: showContextInfo,
		  loadEditor:loadEditor
	  }
})();