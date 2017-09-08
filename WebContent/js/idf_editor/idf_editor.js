/**
 *  Created by Haoyu Feng
 */

function IDF_EDITOR(configs){
	/*	configs = {};*/
/*		configs.project_id = 38;
		configs.branch_id = 76;
		configs.commit_id = 208;*/
/*		configs.commit_mode = "file";*/
				
		
    	var self = this;
    	var idfScope = this;
    	this.mode_options = {display:0, text_edit:1, widget_edit:2};
    	this.state = {
    			project_id:configs.project_id,
    			branch_id:configs.branch_id,
    			commit_id:configs.commit_id,
    			isDirty:false,
    			curMode: self.mode_options.display,
    			curLeafId:null,
    			curLeafLabel:null,
    			curIdfObj:null,
    			tempFiles:[],
    			savedFiles:[],
    			commitRecords:[],
    	}
    	
    	//idf content sent to the front-end
     	this.idf_Objects = null;
    	this.idf_objects_copy = null;
/*     	this.idf_TreeHtml = null; 	
    	this.idf_rules = null; 
    	this.idf_RawText = null; */
    	this.idf_DataHtml = null;
    	this.idf_Text = null;
    	this.tree_search = null;
    	this.content_data = null;   	
    	this.text_editor = null;
    	this.widget_editor = null;
    	this.idf_rule_manager = IDF_RULEMANAGER;
    	this.idf_instruction_service = IDF_INSTRUCTIONSERVICE;
    	this.idf_tooltip_service = IDF_TOOLTIPSERVICE;
/*     	this.autoComplete = function(cm, option){
    		return new Promise(function(accept){
    			setTimeout(function(){
    				var cursor
    			})
    			
    			
    		})
    	} */    	  	
    	
    	function pullIdfContentPromise(){
            var project_id = self.state.project_id;
            var branch_id =  self.state.branch_id;
            var commit_id = self.state.commit_id;
    		var pullPromise = $.ajax({
    			type:"POST",
    			url:"./CommitView?type=tree",
    			data: {'project_id':project_id, 'branch_id':branch_id, 'commit_id':commit_id},
    			cache:true,
    			dataType:'json',
    		})   		
    		return pullPromise;		
    	}
    			
    	this.pullIdfContent = function(){    		  
            //here only need to update the 
			//pullIdfContentPromise().then(function(data){
    			data = test_data;
				self.content_data = data;
				self.idf_rules = data["idfRules"];
				self.idf_TreeHtml = data["treeHtml"];
				self.idf_DataHtml = data["data"];
				self.idf_Text = data["idfText"];
				self.idf_Objects = data["obj"];
				self.tree_search =  data["treeSearch"];
 				$("#base").html(self.idf_DataHtml["1-1-1"]['baseContent']);
				//loadTextEditContent(); 							
			//});	
    		
    	}
    	  		
    	
    	this.backupIdfObjs = function(){
    		self.idf_objects_copy = self.deepCopyIdfObjs(self.idf_Objects);
    		IDF_OBJMANAGER.loadIdfObjs(self.idf_objects_copy);
    	}
    	
    	
    	this.deepCopyIdfObjs = function(IdfObjs){
    		var cloned = JSON.parse(JSON.stringify(IdfObjs));   				
 	  		return cloned;  		
    	}
    	
    	
    	this.findIdfObjsByLabel = function(label){
    		return self.idf_objects_copy.objMap[label.toLowerCase()];   		
    	}
    	
    	
    	this.getReferencedValuesByObjList = function(objList){
    		var values = [];
    		//var referencedLabels = self.idf_ruleManager.getReferencedObjLabelsByObjList(objList);
    		for(var i = 0; i < objList.length; i++){
    			var objListItem = objList[i];
    			Array.prototype.push.apply(values, self.getReferencedValuesByObjListItem(objListItem));  			    	
    		}
    		return values;
    	}
    	
		this.getReferencedValuesByObjListItem = function(objListItem){
			var fields = self.idf_rule_manager.getReferenceObjFieldsByObjListItem(objListItem);
			var result = [];
			for(var i = 0; i < fields.length; i++){
				var idfObjs = self.findIdfObjsByLabel(fields[i].label);
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
    	
		
    	this.findRulesByObjectKey = function(objectKey){
    		
    		
    	}
    	
    	
    	
    	//api function to get generated text of selected leaf
    	this.buildTextForCurLeafId = function(){
    		var curLeafId = self.state.curLeafId;
			return buildTextForLeafId(curLeafId);
    	}
    	
    	function buildTextForLeafId(leafId){
    		if(leafId){
    			var curLeafLabel = findLabelByTreeId(leafId);
    			var result = buildTextForSingleIdfLabel(curLeafLabel);
    			
    			self.state.curLeafLabel = curLeafLabel;    					 			
    			return result;
    		}else{
    			return "";
    		}
    	}
    	
    	function buildTextForSingleIdfObj(idfObj){
    		if(!idfObj) return "";		
     		var text = "";
     		var singleSpace = " "; 
     		var singleTab = "  ";
     		var doubleTab = "    ";
     		var lineCommentPrefix = "!- ";
     		var newLine = "\n";
     		var comma = ",";
     		var semiColon = ";";
     		var valueSpaceLength = 80;
    		
			//create topcomments text
			for(topCommentIndex in idfObj.topComments){
				text+=idfObj.topComments[topCommentIndex]+newLine;
			}
			//create keyword text
			var objLabel = idfObj.objLabel;
			text+=singleTab+objLabel+comma+newLine;
			
			//create values + lineComment text
			var valLength = idfObj.values.length;
			for(var i=0;i<valLength;i++){
				var value = idfObj.values[i];
				var extraSpaceLength = valueSpaceLength - value.length;				
				var extraSpace = "";
				for(var j=0;j<extraSpaceLength;j++){
					extraSpace+=singleSpace;
				}
				if(i !== (valLength-1)){
					text+=doubleTab+value+comma;
				}else{
					text+=doubleTab+value+semiColon;
				}
				
				if(idfObj.commentsNoUnit[i]){
					text+=extraSpace+lineCommentPrefix+idfObj.commentsNoUnit[i];
				}								
				text+=newLine;
			}		
			return text;  		
    	}
    	
    	
     	function buildTextForSingleIdfLabel(label){
			var idfObjArrayByLabel = self.idf_objects_copy.objMap[label.toLowerCase()];
			var textByLabel = "";
			
			
     		for(idfObjIndex in idfObjArrayByLabel){
     			var idfObj = idfObjArrayByLabel[idfObjIndex];
     			textByLabel += buildTextForSingleIdfObj(idfObj)+"\n";
     		}
     		return textByLabel;
    	}
     	
     	    	
     	function findLabelByTreeId(leafId){     		
     		for(labelName in self.tree_search){
     			if(self.tree_search[labelName]===leafId){
     				return labelName;
     			}	
     		}     		
     	}
     	
     	
     	this.buildHtmlForCurLeafId = function(){
     		var curLeafId = self.state.curLeafId;
     		return self.idf_DataHtml[curLeafId];    		
     	}
     	
     	this.checkEditorStatus = function(){
     		var fileState = self.saveTextFile();
     		self.state.isDirty = self.state.tempFiles.length > 0 || fileState.isDirty; 		
     		self.state.isValid = self.state.tempFiles.length === 0 && fileState.isValid;    		
     	}
     	
     	
       	function Operation(action, objKey, newValues, newFile){
    		this.action = action,
    		this.objKey = objKey,
    		this.newValues = newValues,
    		this.newFile = newFile
    	}
        
       	
      	function pushToCommitRecords(operation){
    		//check all saved changes, compare and make commit changes
    		
    		
    		   		 		
    	}
     	

      	
      	
     	
     	function checkDeleteOperations(origFile, savedFile){
     		var records = [];
     		var savedObjs =  savedFile.fileState.updatedObjs;
     		for (var i = 0; i < origFile.length; i++){
     			var operation = null;
     			var origObj = origFile[i];
     			var found = false;
     			for(var j = 0; j < savedObjs.length; j++){
     				if(origObj.objKey === savedObjs[i].objKey){
     					found = true;
     					break;
     				}
     			}
     			if(found === false){
     				operation = new Operation('delete', origObj.objKey, null);
     				records.push(operation);
     			}
     		}
     		return records;
     	}
     	
     	function checkAddAndUpdateOperations(origFile, savedFile){
     		var records = [];
     		var savedObjs =  savedFile.fileState.updatedObjs;
     		for(var i = 0; i < savedObjs.length; i++){
     			var savedObj = savedObjs[i];
     			var origObj = self.idf_Objects.objKeyMap[savedObj.objKey];
     			var operation = null;
         		if(origObj == null){
         			operation = new Operation('add', savedObj.objKey, savedObj.properties);
         			records.push(operation);
         		}else{
             		operation = new Operation('update', savedObj.objKey, []);
             		var properties = savedObj.properties;     	
             		for(var i = 0; i < properties.length; i++){
             			if(properties[i].propertyValue != origObj.values[i]){  				
             				operation.newValues.push(properties[i]);
             			}
             		}
             		if(operation.newValues.length > 0){
             			records.push(operation); 
             		}
         		}      		   			
     		}
     		return records;
     	}
     	
     	
     	this.compareOrigState = function(origFiles, savedFiles){
     		var records = [];
     		var record = null;
     		for(var i = 0; i < savedFiles.length; i++){
     			var savedFile = savedFiles[i];
     			if(savedFile.fileState.mustReplace){
     				record = new Operation('replace', savedFile.fileLabel, null, savedFile.fileState.updatedObjs);
     				records.push(record);
     			}else{     				     						
     				var origFile =  origFiles.objMap[savedFile.fileLabel];
					    				     				
     				deleteOperations = checkDeleteOperations(origFile, savedFile);
     				addAndUpdateOperations = checkAddAndUpdateOperations(origFile, savedFile);
     				    				
     				Array.prototype.push.apply(records,deleteOperations);
     				Array.prototype.push.apply(records,addAndUpdateOperations);
     			}
     		}
     		return records;    		   		
     	}
     	
    	this.commitChanges = function(){
			self.checkEditorStatus();
    		var tempFiles = self.state.tempFiles;
    		var savedFiles = self.state.savedFiles;
			
    		if(self.state.isDirty === false){
    			alert("No changes made");
    			return false;
        	}else{
        		if(self.state.isValid === false){
        			var warningMsg = "There are some files with errors, please fix: \n"
        			for(var i = 0; i < tempFiles.length; i++){
        				warningMsg += i+1 +". " + tempFiles[i].fileLabel + "\n";
        			}      			
        			alert(warningMsg);
        			return false;
        		}else{
        			if(configs.commit_mode === "operations"){
            			var commitRecords = "Below are commited operation records: \n";
    					var records = self.compareOrigState(self.idf_Objects, savedFiles);
    					alert(records.length);       				
        			}else{
        				var commitFiles = savedFiles.map(function(file){
        					return {label: file.label, leafId:file.leafId, text: file.text}});
        				alert("Commit files !!!")
        			}       			
					history.go(-1);
					return false;
        		}
        	}	
    	}
    	   	   	        
        
        //processNode is backward
        function processNode(node){
        	var idfRef = node.ref;      	       	       	
        	var updatedIdfObj = {
        			properties:[],
        			ref:idfRef,
        			objLabel: idfRef.name,
        			objKey: null
        	};
        	//handle the end prop first
/*         	var endProp = node.curProp;
        	var propertyKey = endProp.property.name;
    		var propertyValue = endProp.value ? endProp.value : '';
    		var record = {propertyKey: propertyKey, propertyValue:propertyValue};
    		updatedIdfObj.properties.unshift(record);  */   
        	
        	      	
        	var curProp = node.lastProp;
        	while(curProp != null){
        		var propertyKey = curProp.property.name;
        		var propertyValue = curProp.value ? curProp.value : '';
        		var record = {propertyKey: propertyKey, propertyValue:propertyValue};
        		updatedIdfObj.properties.unshift(record);      		
        		curProp = curProp.lastProp;        	
        	}
			       	
        	updatedIdfObj.objKey = updatedIdfObj.ref.name === 'Name' ? (updatedIdfObj.objLabel+"_"+updatedIdfObj.properties[0].propertyValue) : updatedIdfObj.objLabel;    
        	return updatedIdfObj;
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
        
        
        this.checkDirty = function(){
        	var editHistory = self.text_editor.getHistory().done;
        	for(var i = 0; i < editHistory.length; i++){
        		var recordType = self.text_editor.getHistory().done[i].constructor.name;
        		if(recordType === 'Object'){
        			return true;
        		}
        	}
        	return false;
        }
        
        
        
    	function processLastTokenState(lastToken){
    		var isValid = lastToken.state.isValid;
    		var isDirty = self.checkDirty();
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
        
        
        this.getFileState = function(){
        	var text_editor = self.text_editor;
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
        
        
        function getSavedTextFromEditor(){
        	self.text_editor.save();
        	var fileText = self.text_editor.getTextArea().value;
        	return fileText;
        }
        
        function pushToTempFiles(){
        	function getTempFile(tempFiles, leafId){
        		for(var i = 0; i < tempFiles.length; i++){
        			if(tempFiles[i].leafId === leafId){
        				return tempFiles[i];
        			}
        		}
        		return null;
        	}
        	var tempFileText = getSavedTextFromEditor();
        	var leafId = self.state.curLeafId;
        	var fileLabel = self.state.curLeafLabel;
        	var tempFile = getTempFile(self.state.tempFiles, leafId)
        	if( tempFile != null){
        		tempFile.text = tempFileText;
        	}else{
            	var indexedTempFile = {leafId:leafId, fileLabel:fileLabel, text: tempFileText};
            	self.state.tempFiles.push(indexedTempFile); 
        	}   
        }
      	
		function pushToSavedFiles(updatedFilestate){			
        	function getSavedFile(savedFiles, leafId){
        		for(var i = 0; i < savedFiles.length; i++){
        			if(savedFiles[i].leafId === leafId){
        				return savedFiles[i];
        			}
        		}
        		return null;
        	}
        	var savedFileText = getSavedTextFromEditor();
        	var leafId = self.state.curLeafId;
        	var savedFile = getSavedFile(self.state.savedFiles, leafId);
        	if(savedFile != null){
        		savedFile.text = savedFileText;
        	}else{
    			var indexedSavedFile = {
    					leafId:self.state.curLeafId,
    					fileLabel:self.state.curLeafLabel,
    					fileState:updatedFilestate,
    					text:savedFileText
    			}
    			self.state.savedFiles.push(indexedSavedFile);
        	}	
		}
		
      	this.cleanEditorState = function(){
      		self.state.tempFiles = [];
      		self.state.savedFiles = [];
      		self.idf_objects_copy = self.deepCopyIdfObjs(self.idf_Objects);
      	}
		
		
		function cleanTempFileByLabel(label){      	
        	var tempFiles = self.state.tempFiles;
        	for(var i = tempFiles.length - 1; i >= 0; i--){
        		if(tempFiles[i].fileLabel.toLowerCase() === label){
        			tempFiles.splice(i, 1);
        		}
        	}
		}
		
		
      	
        function syncIdfObjsAndFile(fileState){
        	var origObjs = self.idf_Objects;
        	var trackObjs = self.idf_objects_copy;
        	var updatedObjs = fileState.loadIdfObjs();
        	fileState.updatedObjs  = updatedObjs;       	
        	fileState.fileLabel = fileState.ref.name.toLowerCase();
        	
        	//clean the corresponding temp file if exist
        	cleanTempFileByLabel(fileState.fileLabel);
        	
        	if(fileState.ref.unique === true || fileState.ref.fieldlist[0].name === 'Name'){        		
        		fileState.mustReplace = false;
        	}else{
        		fileState.mustReplace = true;
        	}
        	           	      	      	
        	function getObjByKey(objArray, key){
        		for(var i = 0; i < objArray.length; i++){
        			if(objArray[i].objKey === key){
        				return objArray[i];
        			}
        		} 
        		return null;
        	}
        	        	
        	
        	
        	function updateIdfObj(baseObj, compObj){
        		//var operation = new Operation('update', baseObj.objKey, []);
        		for(var valueIndex in compObj.properties){   			
        			if(compObj.properties[valueIndex].propertyValue !== baseObj.values[valueIndex]){
        				baseObj.values[valueIndex] = compObj.properties[valueIndex].propertyValue;
        				//opeation.newValues.push(compObj.properties[valueIndex]);
        			}
        		}
/*         		if(operation.newValues.length > 0){
        			commitRecords.push(operation);
        		}  */    		
        	}
        	
        	//this method is for updated labels not existed in current objMap
        	function addIdfObj(addedObj){
        		//var operation = new Operation('add', addedObj.objKey,addedObj.properties);

        		var newObj = convertUpdatedObjToOrigObjFormat(addedObj);
        		//if the label doesn't exist, need to add the label first
         		if(!trackObjs.objMap[newObj.objLabel.toLowerCase()]){
         			trackObjs.objMap[newObj.objLabel.toLowerCase()] = [newObj];
         		}else{
         			trackObjs.objMap[newObj.objLabel.toLowerCase()].push(newObj);         			
         		}
        	}
        	
        	function convertUpdatedObjToOrigObjFormat(replacedObj){
        		var newValues = [];
        		var newCommentsNoUnit = [];
        		
        		var properties = replacedObj.properties;   		
        		for(var i = 0; i < properties.length; i++){
        			newCommentsNoUnit.push(properties[i].propertyKey.toString());
        			newValues.push(properties[i].propertyValue.toString());
        		}
        		var convertedObj = {
       				objLabel:replacedObj.objLabel,
       				objKey: replacedObj.objKey,
       				values: newValues,
       				commentsNoUnit: newCommentsNoUnit,
        		}
        		return convertedObj;
        	}
        	
        	
        	function replaceObjs(replacedObjs){
        		var convertedObjs = [];        		
        		for(var i = 0; i < replacedObjs.length; i++){
        			var convertedObj = convertUpdatedObjToOrigObjFormat(replacedObjs[i]);
        			convertedObjs.push(convertedObj);  			
        		}
        		trackObjs.objMap[fileState.fileLabel] = convertedObjs;        		
        	}
        	       	
        	
        	if(fileState.mustReplace){
            	replaceObjs(updatedObjs);  		        		       		
        	}else{
        		//update objMap    	
            	var trackObjArrayByLabel = trackObjs.objMap[fileState.ref.name.toLowerCase()];
              	//if the label does not exist on current objs, then it is an add operation
            	if(trackObjArrayByLabel == null){
            		for(var i = 0; i < updatedObjs.length; i++){
            			var updatedObj = updatedObjs[i];
            			addIdfObj(updatedObj);      			    			
            		}       			
            	}else{
            		for(var i = 0; i < updatedObjs.length; i++){
            			//check update  first
            			var updatedObj = updatedObjs[i];
            			var trackObj = null;            			
           				trackObj = getObjByKey(trackObjArrayByLabel, updatedObj.objKey);
           				if(trackObj == null){
           					addIdfObj(updatedObj);  
           				}else{
           					updateIdfObj(trackObj, updatedObj);
           				}
           			}
            		//check delete
                	var length = trackObjArrayByLabel.length;
                	for(var i =  length - 1 ; i >= 0; i--){
                		var trackObj = trackObjArrayByLabel[i];
                		var compObj = getObjByKey(updatedObjs, trackObj.objKey);
                		
               			if(compObj == null){
               				//need to delete the obj from the trackobj
               				trackObjArrayByLabel.splice(i, 1);    				
               			}              		
                	}
            		
            	}      		
        	}
        	    	      	   	
        } 
        
        this.loadTextForCurLeafId = function(){
        	
        	var divText = '';
			//if there is temp file for this Id, then show the temp file
			var tempFile = self.state.tempFiles.filter(function(temp){
				return temp.leafId == self.state.curLeafId;
			});
			
        	
			if(tempFile.length > 0){
				divText = tempFile[0].text;
				
			}else{
				var savedFile = self.state.savedFiles.filter(function(temp){
					return temp.leafId == self.state.curLeafId;
				});
										
				divText = savedFile.length > 0 ? savedFile[0].text : self.buildTextForCurLeafId();
			}
			return divText;
        }
       
               
               
        this.saveTextFile = function(){
        	//if all nodes are valid, then syncIdfObjData  	
        	var fileState = self.getFileState();
        	if(fileState == null){
        		return;
        	}       		        	
         	if(fileState.isDirty){
         		if(!fileState.isClosed){
         			fileState.errors.push("There are idf objects not closed");
         			fileState.isValid = false;
         		}      		        		
        		if(fileState.isValid){
        			syncIdfObjsAndFile(fileState);       			
        			pushToSavedFiles(fileState);         			
        		}else{
        			pushToTempFiles();	
        		}
        	}
         	return fileState;
        }
        
 //--------------------------Methods Called By CodeMirror--------------------------       
        
		this.isValidPropertyValue = function(field, value) {
			if (self.validateFieldValue(field, value) != "") {
				return false;
			}
			return true;
		}
        
        
        this.validateFieldValue = function(field, value){
			if(field == null){
				return "The field does not exist";
			}
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
						var availableRefs = self.getReferencedValuesByObjList(objList);
						if(!availableRefs.includes(value)){
							return "The value is not in the object list"
						}
					}							
					return "";
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
        
        
    }