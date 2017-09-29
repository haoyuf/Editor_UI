/**
 * 
 */

IDF_FILEMANAGER = (function(){
	var text_editor = null;
	var leafId = null;
	
	function loadEditor(textEditor, id){
		text_editor = textEditor;
		leafId = id;
		return this;
	}
	
	function getFileState(){
		if(text_editor == null){
			return null;
		}
    	var fileLastLine = text_editor.lastLine();
    	while(text_editor.getLineTokens(fileLastLine).length === 0 && fileLastLine > 0){
    		fileLastLine--;
    	}      	
    	if(fileLastLine === 0){
    		return null;
    	}       	
    	var lastToken = text_editor.getLineTokens(fileLastLine)[text_editor.getLineTokens(fileLastLine).length-1];
    	      	
    	return processLastTokenState(lastToken);		
	}
	
	function processLastTokenState(lastToken){
		var isValid = lastToken.state.isValid;
		var isDirty = checkDirty();
		var isClosed = lastToken.state.closed;
		
		
		var populateIdfObjs = function(lastToken){
			return getIdfObjsFromFile(lastToken);
		}
		   		   		   		
		return {
			isValid : isValid,
			isDirty : isDirty,
			ref : lastToken.state.curNode.ref,
			loadIdfObjs : function (){    				
				return populateIdfObjs(lastToken);
			},
			isClosed : isClosed,
			errors:[]
		};
	}
	
    function getIdfObjsFromFile(lastToken){
		var nodes = lastToken.state.nodes;
		var processedNodes = [];
		var curNode = nodes;
		while(curNode.node != null){
			var processedNode = processNode(curNode.node);
			processedNodes.unshift(processedNode);
			curNode = curNode.next;	
		}
		return processedNodes;
    }
	
    function processNode(node){
    	var idfRef = node.ref;      	       	       	
    	var updatedIdfObj = {
    			properties:[],
    			ref:idfRef,
    			objLabel: idfRef.name,
    			objKey: null
    	};
    	      	
    	var curProp = node.lastProp;
    	while(curProp != null){
    		var propertyKey = curProp.property.name;
    		var propertyValue = curProp.value ? curProp.value : '';
    		var record = {propertyKey: propertyKey, propertyValue:propertyValue};
    		updatedIdfObj.properties.unshift(record);      		
    		curProp = curProp.lastProp;        	
    	}
		       	
    	updatedIdfObj.objKey = updatedIdfObj.ref.fieldlist[0].name === 'Name' ? (updatedIdfObj.objLabel+"_"+updatedIdfObj.properties[0].propertyValue) : updatedIdfObj.objLabel;    
    	return updatedIdfObj;
    }


    function checkDirty(){
    	var editHistory = text_editor.getHistory().done;
    	for(var i = 0; i < editHistory.length; i++){
    		var recordType = text_editor.getHistory().done[i].constructor.name;
    		if(recordType === 'Object'){
    			return true;
    		}
    	}
    	return false;
    }
    
    function getSavedTextFromEditor(){
    	text_editor.save();
    	var fileText = text_editor.getTextArea().value;
    	return fileText;
    }
     
    function getFileId(){
    	return leafId;
    }
	
	return {
		loadEditor:loadEditor,
		
		getFileState:getFileState,
		
		getSavedTextFromEditor:getSavedTextFromEditor,

		checkDirty:checkDirty,
		
		getFileId:getFileId,
	}
	
})();