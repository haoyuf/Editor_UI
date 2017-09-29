/**
 * 
 */


var IDF_RULEMANAGER_OSM = (function(){
	
	var idf_rules = [];
	var referenceMap = new Map();
	var referenceMapArray = null;
	var handletonameMap = null;
	var nametohandleMap = null;
/*	var idf_server = new Worker('js/idf_editor/idf_server.js');	
	idf_server.addEventListener('message', function(e){
		idf_rules = e.data.objects;
		alert("data loaded by worker!");
	})
	idf_server.postMessage('load data');*/
	
	this.updateExtendedField = function(){
		
		
	}
	function forEach(arr, f) {
	    for (var i = 0, e = arr.length; i < e; ++i) f(arr[i]);
	}
	
	
	function findReferencedFieldsByObjList(objList){
		var values = [];
		for(var i = 0; i < objList.length; i++){
			var objListItem = objList[i];
			Array.prototype.push.apply(values, findReferencedFieldsByObjListItem(objListItem));  			    	
		}
		return values;				
	}
	
	
	function findReferencedFieldsByObjListItem(aFieldObjListItem){
		var foundRes = referenceMap.get(aFieldObjListItem);
		if(foundRes != null){
			return foundRes;
		}
			
		var referenceObjArray = [];			
		for(var i = 0; i < idf_rules.length; i++){
			var idfRuleObj = idf_rules[i];
			var label = idfRuleObj.name;
			for(var j = 0; j < idfRuleObj.fieldlist.length; j++){
				if(idfRuleObj.fieldlist[j].fieldtype === 'N'){
					continue;
				}
				var field = idfRuleObj.fieldlist[j];				
				var fieldReferenceList = eval(field.referencelist);
				if(fieldReferenceList.length === 0) {continue;};
				if(fieldReferenceList.includes(aFieldObjListItem)){					
					referenceObjArray.push({label:label, field: field.name, index: j});
				}
			}			
		}		
		referenceMap.set(aFieldObjListItem, referenceObjArray);		
		return referenceObjArray;	
	}
	
	
	
	function populateReferenceMap(arr, map){
		forEach(arr, function(item){
			map.set(item.referenceKey, item.referenceArray);			
		})	
	}
	
	
	//below method may not be used any more
	function findReferencedObjLabelsByObjListItem(objListItem){
		var fields = findReferenceFields(objListItem);
		var referenceLabelArray = [];
		for(var i = 0; i < fields.length; i++){
			if(!referenceLabelArray.includes(fields[i].label)){
				referenceLabelArray.push(fields[i].label);
			}
		}
		return referenceLabelArray;
	}
	
	
	function getReferencedValuesByObjList(objList, idf_objs){
		var values = [];
		for(var i = 0; i < objList.length; i++){
			var objListItem = objList[i];
			Array.prototype.push.apply(values, getReferencedValuesByObjListItem(objListItem));  			    	
		}
		return values;
	}
	
	function getReferencedValuesByObjListItem (objListItem, idf_objs){
		var fields = findReferencedFieldsByObjListItem(objListItem);
		var result = [];
		if(idf_objs) IDF_OBJMANAGER.loadIdfObjs(idf_objs);		
		for(var i = 0; i < fields.length; i++){			
			//var idfObjs = window.IDF_OBJMANAGER.findIdfObjsByLabel(fields[i].label);
			var idfObjs = IDF_OBJMANAGER.findIdfObjsByLabel(fields[i].label)
			//idf objects under this label does not exist
			if(idfObjs == null){
				continue;
			}
			var fieldIndex = fields[i].index;
			var valuesOfField = [];
			for(var j = 0; j < idfObjs.length; j++){
				valuesOfField.push(idfObjs[j].values[fieldIndex]);
			}
			Array.prototype.push.apply(result, valuesOfField);
		}
		return result;
	}
	
	
	function validateFieldValue(field, value, idf_objs){			
		if (field.required === true
				&& value == null) {
			return "The value is required";
		}
		if (field.fieldtype === "A") {
			// temporary make all name valid
			if (field.type === "choice") {
				var availableChoiceArray = eval(field.key);
				if (!availableChoiceArray
						.includes(value
								.toLowerCase())) {
					return "The value is not in the choice list";
				}
			} else if (field.type === "object-list") {
				var objList = eval(field.objectlist);
				if (objList.length > 0){
					var availableRefs = getReferencedValuesByObjList(objList);
					if(!availableRefs.includes(value)){
						return "The value is not in the object list"
					}
				}							
				return "";
			}else if(field.type === "handle"){
				var handlename = handletonameMap[value];
				if(!handlename){
					return "This handle map does not exist";
				}
			}
			// field type = numeric
		} else if (field.fieldtype === "N") {
			var Autocalculatable = false;
			var Autosizable = false;
			
			if(isNaN(value)){
				if(field.autosizable == true && value !== "autosize"){return "Invalid value";}				
				if(field.autocalculatable == true && value !== "autocalculate"){return "Invalid value";}
				if(field.autosizable == false && field.autocalculatable == false){return "Invalid value";}					
			}
											
			var max = eval(field.max);
			var min = field.min === "-Infinity" ? Number.NEGATIVE_INFINITY
					: eval(field.min);
			if (value > max || value < min) {
				return "The value is out of range";
			}												
		}
		return "";	
	}
	
	
	function getObjRuleByLabel(labelName){
		if(idf_rules){	
			return idf_rules.find(function(ruleObj){
				return ruleObj.name === labelName;
			})						
		}
		return null;
	}
	
	function buildObjTemplateByLabel(label){
		var objRule = getObjRuleByLabel(label);
		return buildObjTemplateByObjRule(objRule);
	}
	
	
	function buildObjTemplateByObjRule(objRule){
		//var result = "" + objRule.name + ",\n";
		var result = "\n";
		
		function capitalizeString(str){
			return str.charAt(0).toUpperCase() + str.slice(1);
		}
		
		function getDefaultValueByField(field){
			var defaultValue = null;
			if(field.fieldtype === "N"){
				defaultValue = 1;
			}else{
				switch(field.type){
					case "choice":
						defaultValue = eval(field.key)[0];
						break;
					
					case "object-list":
						var objList = eval(field.objlist);
						var referencedValues = getReferencedValuesByObjListItem(objList[0]);
						defaultValue = referencedValues[0];
						break;
					default:
						defaultValue=""; 	
					}
			}
			
			return defaultValue;
		}
		
		function buildObjTemplateByField(field, isClosed){
			var valueString = field.required ? getDefaultValueByField(field):"";
			var separator = isClosed ? ";" : ",";
						
			var valueSpaceLength = 80;
			var extraSpaceLength = valueSpaceLength - valueString.length;
			var extraSpace = "";
			for(var j=0;j<extraSpaceLength;j++){
				extraSpace+=" ";
			}
					
			result += "\t" + valueString + separator + extraSpace + buildCommentForField(field) +"\n";			
		}
		
		function buildCommentForField(field){
			var comment = "!-" + field.name;
			return comment;			
		}
		
		forEach(objRule.fieldlist.slice(0, objRule.minfield - 1), buildObjTemplateByField);
		buildObjTemplateByField(objRule.fieldlist[objRule.minfield - 1], true);
		
		result = result.slice(0, -2) + ";";
				
		return result;	
	}
	
	function getNameByHandle(handleHash){
		return handletonameMap[handleHash];		
	}
	
	function getHandleByName(handleName){
		return nametohandleMap[handleName];
	}
	
	function loadIdfRulesPromise(){
		var promiseObj = new Promise(function(resolve, reject){   			
			if(idf_rules != null && idf_rules.length > 0){
				resolve();
			}else{
				/*loadIDFRule();
				if(idf_rules!= null){
					alert("resolved!");
					resolve();
				}*/
				
    			/*if(idd_data){
    				idf_rules = idd_data.objects;
    				alert("idfss rules loaded from local file!");
    				resolve();
    			}else{
    				$.ajax({
    	    			type:"GET",
    	    			url:"./LoadIDFRules",
    	    			data: {},
    	    			//cache:true,
    	    			dataType:'json',
    	    			success: function(data){
    	    				idf_rules = data.objects;
    	    				alert("idfss rules loaded by service");	    				
    	    				resolve();
    	    			},
    	    			error:function(err){
    	    				self.errorText = err.responseText;
    	    				self.error = JSON.parse(err.responseText);
    	    				alert("error...");
    	    				reject(err);
    	    			}
    	    		}); 
    			} 				 */ 				
			}    		
		});
		return promiseObj;	
	}

	
	
	function loadIdfRulesByLabelPromise(commitId,label){
		var promiseObj = new Promise(function(resolve, reject){
			var rules = getObjRuleByLabel(label);
			
			if( rules != null){
				resolve();
			}else{
				$.ajax({
	    			type:"GET",
	    			url:"./LoadOSMIDFRulesByLabel?commit_id=" + commitId + "&obj_label="+label,
	    			data: {},
	    			//cache:true,
	    			dataType:'json',
	    			success: function(data){
	    				var obj_rules = data.data.objects[0];
	    				idf_rules.push(obj_rules);
	    				alert("idf obj rules loaded by service");	    				
	    				resolve();
	    			},
	    			error:function(err){
	    				self.errorText = err.responseText;
	    				self.error = JSON.parse(err.responseText);
	    				alert("error...");
	    				reject(err);
	    			}
	    		}); 							
			}    		
		});
		return promiseObj;		
	}
	
	
	function loadIdfReferencesMapPromise(commitId){
		var promiseObj = new Promise(function(resolve, reject){		
			if(referenceMap.entries.length != 0){
				resolve();
			}else{
				$.ajax({
	    			type:"GET",
	    			url:"./LoadOSMIDFReferences?commit_id="+commitId,
	    			data: {},
	    			//cache:true,
	    			dataType:'json',
	    			success: function(data){
	    				referenceMapArray = data.data.map;
	    				populateReferenceMap(referenceMapArray, referenceMap);
/*	    				idf_rules.push(obj_rules);
	    				alert("idf obj rules loaded by service");	 */   				
	    				resolve();
	    			},
	    			error:function(err){
	    				self.errorText = err.responseText;
	    				self.error = JSON.parse(err.responseText);
	    				alert("error...");
	    				reject(err);
	    			}
	    		}); 							
			}    		
		});
		return promiseObj;		
	}
	
	
	
	function loadHandleMapPromise(commitId){
		var promiseObj = new Promise(function(resolve, reject){		
			if(referenceMap.entries.length != 0){
				resolve();
			}else{
				$.ajax({
	    			type:"GET",
	    			url:"./LoadOSMIDFHandleMap?commit_id="+commitId,
	    			data: {},
	    			//cache:true,
	    			dataType:'json',
	    			success: function(data){
	    				//referenceMapArray = data.data.map;
	    				handletonameMap = data.data.handletoname;
	    				nametohandleMap = data.data.nametohandle;
	    								
	    				resolve();
	    			},
	    			error:function(err){
	    				self.errorText = err.responseText;
	    				self.error = JSON.parse(err.responseText);
	    				alert("error...");
	    				reject(err);
	    			}
	    		}); 							
			}    		
		});
		return promiseObj;		
	}
	
	
	function loadIdfRulesByLabelAndReferences(commitId,label){
			return Promise.all(
					[loadIdfRulesByLabelPromise(commitId,label), 
					loadIdfReferencesMapPromise(commitId),
					loadHandleMapPromise(commitId)]);		
	}
	
	
	function createReferenceMap(fieldObjList){
		for(var i = 0; i < fieldObjList.length; i++){
			var aFieldObjName = fieldObjList[i];
			var referenceMap = findReferenceMap(aFieldObjName);
			referenceMapArray.push(referenceMap);	
		}			
	}
	
	return {
		loadIdfRulesPromise : loadIdfRulesPromise,
		
		loadIdfRulesByLabelPromise : loadIdfRulesByLabelPromise,
		
		loadIdfReferencesMapPromise : loadIdfReferencesMapPromise,
		
		loadIdfRulesByLabelAndReferences : loadIdfRulesByLabelAndReferences,
		
		checkRuleLoaded : function(){
			return idf_rules != null; 
		},
		
		createReferenceMap : createReferenceMap,
		
		
		getReferencedObjLabelsByObjList: function(objList){
			var result = {};
			for(var i = 0; i < objList.length; i++){
				result[objList[i]] = findReferencedObjLabelsByObjListItem(objList[i]);
			}
			return result;			
		},
		//below methods will be cleaned after redesign the editor
		getReferencedObjLabelsByObjListItem : findReferencedObjLabelsByObjListItem,
			
		//this is the new method, all new methods are against fields rather than label
		getReferenceObjFieldsByObjListItem : findReferencedFieldsByObjListItem,
		
		getAllLabels : function(){
			var labels = [];			
			for (var i = 0; i < idf_rules.length; i++) {
				labels.push(idf_rules[i].name);
			}
			return labels;
		},
		
		
		getRuleByLabel : getObjRuleByLabel,
		
		getRuleByLabelAndField : function(labelName, fieldName){
			
			
		},
		
		
		isValidFieldValue: function(field, value){
			if (validateFieldValue(field, value) != "") {
				return false;
			}
			return true;		
		},
		
		getReferencedValuesByObjList : getReferencedValuesByObjList,
		
		getObjTemplateByLabel :buildObjTemplateByLabel,

		getObjTemplateByObjRule: buildObjTemplateByObjRule,
		
		getHandleByName : getHandleByName,
		
		getNameByHandle : getNameByHandle,
		
		
	};
	
	
})();