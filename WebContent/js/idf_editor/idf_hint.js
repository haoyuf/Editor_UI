/**
 * For auto completion purpose
 */

(function(mod){
  if (typeof exports == "object" && typeof module == "object") // CommonJS
	    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror){
	var Pos = CodeMirror.Pos;
	
	function forEach(arr, f, options) {
	    for (var i = 0, e = arr.length; i < e; ++i) f(arr[i], options);
	}

	function arrayContains(arr, item) {
	    if (!Array.prototype.indexOf) {
	      var i = arr.length;
	      while (i--) {
	        if (arr[i] === item) {
	          return true;
	        }
	      }
	      return false;
	    }
	    return arr.indexOf(item) != -1;
	}
	
	var stage = {
			noNodes : 0,
			labelDeclared : 1,
			nodeCreated : 2,
			propertyValueCreated : 3,
			propertyValueClosed : 4,
			nodeClosed : 5,
		}
	
	function scriptHint(editor, getToken, options){
		//Find the token at the cursor
		var cur = editor.getCursor(), token = getToken(editor, cur);
		if (/\b(?:string|comment)\b/.test(token.type)) return; //comment type will not invoke autocompletion
		token.state = CodeMirror.innerMode(editor.getMode(), token.state).state;
		
		var context = {};
		
		//If it's not a 'word-style' token, ignore the token.
		if(token.string === ","){
			context.readyToAutoCompleteTemplate = true;
		}
		if (!/^[\w$_]*$/.test(token.string)) {
		      token = {start: cur.ch, end: cur.ch, string: "", state: token.state,
		               type: token.string == "." ? "property" : null};
		} else if (token.end > cur.ch) {
		      token.end = cur.ch;
		      token.string = token.string.slice(0, cur.ch - token.start);
		}
					
	    return {list: getCompletionsForIDF(token, context, options),
            from: Pos(cur.line, token.start),
            to: Pos(cur.line, token.end)};
	}
	
	function idfHint(editor,options){
		return scriptHint(editor, function(e, cur){return e.getTokenAt(cur);},
				options);
	}
		
	CodeMirror.registerHelper("hint","idf",idfHint);
	
	
	function getCompletionsForIDF(token, context, options){
		var found = [], start=token.string, tokenState = token.state;		
		
		
		function maybeAddForWord(str, options){ //needs to make it neglect upper case and lower case
			var ignoreCase = options && options.ignoreCase;
			var capitalize = options && options.capitalize;
			var add = false;
			
			if(ignoreCase){
				var newStr = str, newStart = start, lowerCaseStr = newStr.toLowerCase(), lowerCaseStart = newStart.toLowerCase();			
				add = (lowerCaseStr.lastIndexOf(lowerCaseStart, 0) == 0 && !arrayContains(found,str));								
			}else{
				add = (str.lastIndexOf(start,0)==0 && !arrayContains(found,str));
			} 
			
			if(add) found.push(str);		
		}
		
		function getCompletionsForLabel(tokenState, start, options){
			//only allow the label in current page, so there are only one label allowed
			var curLabel = tokenState.curNode.ref.name;
			maybeAddForWord(curLabel,{ignoreCase: true, capitalize: true});
		}
		
		function getCompletionsForField(tokenState, start, options){
			var fieldRef = tokenState.curNode.curProp.property;
			switch(fieldRef.type){
				case "choice":
					getCompletionsForChoice(fieldRef, start, options);
					break;
				case "object-list":
					getCompletionsForReferences(fieldRef, start, options);
					break;
			}
		}
				
		function getCompletionsForChoice(fieldRef, start, options){
			forEach(eval(fieldRef.key), maybeAddForWord, {ignoreCase: true, capitalize: true});
		}
		
		function getCompletionsForReferences(fieldRef, start, options){
			var referenceValues = IDF_RULEMANAGER.getReferencedValuesByObjList(eval(fieldRef.objectlist), IDF_OBJMANAGER.getIdfObjs());
			forEach(referenceValues, maybeAddForWord);
		}
		
		function getCompletionsForObjTemplate(tokenState, start, options){
			var template = IDF_RULEMANAGER.getObjTemplateByObjRule(tokenState.curNode.ref);
			found.push(template);
		}
		
		
		switch(tokenState.stage){
			case stage.noNodes:
			case stage.nodeClosed:
				getCompletionsForLabel(tokenState, start, options);
				break;
			case stage.nodeCreated:
				if(context.readyToAutoCompleteTemplate){
					getCompletionsForObjTemplate(tokenState,start, options);
				}else{
					getCompletionsForField(tokenState,start, options);
				}				
				break;

			case stage.propertyValueCreated:
				getCompletionsForField(tokenState,start, options);
				break;				
		}
				
		return found;
	}
	
	
	
	
	
	
	
	//defining some properties for different type of obj
/*	var stringProps = ("Simu charAt charCodeAt").split(" ");
	var arrayProps =("SimulationControl,\n  No,\nNo; concat").split(";");
	var funcProps = "prototype apply call bind".split(" ");
	var idfKeywords = ("break case");*/
	
	//find all properties of one object, include its parents's properties
/*	function forAllProps(obj, callback){
		//if no own property
		if(!Object.getOwnPropertyNames || !Object.getPrototypeOf){
			for(var name in obj) callback(name);
		}else{
			for(var o = obj; o; o = Object.getPrototypeOf(o))
				Object.getOwnPropertyNames(o).forEach(callback);
		}
	}*/
		
/*	function getCompletions(token, context, keywords, options){
		var found = [], start=token.string, global = options && options.globalScope || window;
		function maybeAdd(str){
			if(str.lastIndexOf(start,0)==0 && !arrayContains(found,str)) found.push(str);		
		}
		
		function gatherCompletions(obj){
			//if(typeof obj == "string") forEach(stringProps, maybeAdd);
			else if(obj instanceof Array) forEach(arrayProps, maybeAdd);
			//else if(obj instanceof Function) forEach(funcProps, maybeAdd);
			forAllProps(obj, maybeAdd);		
		}
		
		if(context && context.length){
			//If this is a property, see if it belongs to some object we can
			//find in the current environmen
			var obj = context.pop(), base;
			if(obj.type && obj.type.indexOf("variable") === 0){
				if(options && options.additionalContext)
					base = options.additionalContext[obj.string];
				if(!options || options.useGlobalScope !== false)
					base = base || global[obj.string];
			}else if(obj.type =="string"){
				base = "";
			}else if(obj.type == "atom"){
				base = 1;
			}else if(obj.type == "function"){
				if(global.jQuery != null && (obj.string =='$' || obj.string =='jQuery') &&
						(typeof glolabl.jQuery == 'function'))
					base = global.jQuery();
				else if(global._ != null && (obj.string == '_') && (typeof global._ == 'function'))
					base = global._();
			}
				
			while(base != null && context.length)
				base = base[context.pop().string];
			if(base != null) gatherCompletions(base);
			
		}else{
	      // If not, just look in the global object and any local scope
	      // (reading into JS mode internals to get at the local and global variables)
	      for (var v = token.state.localVars; v; v = v.next) maybeAdd(v.name);
	      for (var v = token.state.globalVars; v; v = v.next) maybeAdd(v.name);
	      if (!options || options.useGlobalScope !== false)
	        gatherCompletions(global);
	      forEach(keywords, maybeAdd);			
		}
		return found;
	}*/
	
	

	
})






