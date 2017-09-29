/**
 *  Created by Haoyu Feng
 */

function IDF_EDITOR(configs){		
    	var self = this;
    	var idfScope = this;
    	this.mode_options = {display:0, text_edit:1, widget_edit:2};
    	this.file_type = configs.file_type;
    	this.state = {
    			project_id:configs.project_id,
    			branch_id:configs.branch_id,
    			commit_id:configs.commit_id,
    			isDirty:false,
    			isValid:true,
    			curMode: self.mode_options.display,
    			tempFiles:[],
    			savedFiles:[],
    			dirtyFiles:[],
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
    	this.text_editor_active = null;
    	this.idf_file_manager = IDF_FILEMANAGER;
    	this.text_editors = [];
    	this.text_editors_index = [];
    	this.widget_editor = null;
    	this.idf_rule_manager = getIdfRuleManager();
    	this.idf_instruction_service = IDF_INSTRUCTIONSERVICE;
    	this.idf_tooltip_service = IDF_TOOLTIPSERVICE;
/*     	this.autoComplete = function(cm, option){
    		return new Promise(function(accept){
    			setTimeout(function(){
    				var cursor
    			})
    			
    			
    		})
    	} */    	  	
    	
    	function getIdfRuleManager(){
    		if(self.file_type == "osm"){
    			return IDF_RULEMANAGER_OSM;
    		}else{
    			return IDF_RULEMANAGER_EPLUS;
    		}		
    	}
    	
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
/* 				$("#base").html(self.idf_DataHtml["1-1-1"]['baseContent']);
				loadTextEditContent(); */							
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
    	   	
    	function buildTextForLeafId(leafId){
    		if(leafId){
    			var curLeafLabel = self.findLabelByTreeId(leafId);
    			var result = buildTextForSingleIdfLabel(curLeafLabel);   			    						 			
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
     	
     	    	     	     	
     	this.findLabelByTreeId = function(leafId){     		
     		for(labelName in self.tree_search){
     			if(self.tree_search[labelName]===leafId){
     				return labelName;
     			}	
     		}     		
     	}
     	
     	

     	
     	this.buildHtmlForLeafId = function(leafId){
     		return self.idf_DataHtml[leafId];  
     	}
     	
     	
     	function updateEditorStateForAllFiles(){
     		var dirtyFilesArray = self.state.dirtyFiles;
     		for(var i = 0; i < dirtyFilesArray.length; i++){
     			//var fileState = self.saveTextFile(dirtyFilesArray[i]);
     			updateEditorStateForSingleFile(dirtyFilesArray[i],true);
     		}     		
     	}
     	
     	function updateEditorStateForSingleFile(leafId, forceSave){
     		var fileState = self.saveTextFile(leafId, forceSave);
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
			//updateEditorStateForAllFiles();
			var dirtyFiles = self.state.dirtyFiles;
    		var tempFiles = self.state.tempFiles;
    		var savedFiles = self.state.savedFiles;
			 
    		if(dirtyFiles.length > 0){
    			alert("There are files not saved, please save first");
    			return false;
    		}
    		    		
    		if(self.state.isDirty === false){
    			alert("No changes made");
    			return false;
        	}
    				  
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
    	
    	this.saveChangesForSingleFile = function(leafId, forceSave){
    		if(!leafId){return;}
    		updateEditorStateForSingleFile(leafId, forceSave);
/*    		for(var i = 0; i < self.text_editors.length; i++){
    			self.refreshTextEditor(self.text_editors[i]);
    		}*/
    	}
    	
    	this.refreshTextEditor = function(cm){
    		//cm.refresh();
    		//cm.moveV(0, "page");
    		//cm.execCommand("newlineAndIndent");
    		//cm.execCommand("undo");
    		//cm.getTokenTypeAt({line:20,ch:20});
    		//cm.patchDisplay(cm,0,cm.getDimensions(cm));
    	}
    	
    	   	   	        
        this.getTextEditorByLeafId = function(leafId){
        	var index = self.text_editors_index.indexOf(leafId);        	
        	return self.text_editors[index];  
        }
        
        this.getLeafIdByTextEditor = function(editor){
        	var index = self.text_editors.indexOf(editor);        	
        	return self.text_editors_index[index];       	
        }
    	      
/*        function getTextEditorByLeafId(leafId){
        	var index = self.text_editors_index.indexOf(leafId);        	
        	return self.text_editors[index];     	
        }*/
        
    
        function pushToTempFiles(){
        	function getTempFile(tempFiles, leafId){
        		for(var i = 0; i < tempFiles.length; i++){
        			if(tempFiles[i].leafId === leafId){
        				return tempFiles[i];
        			}
        		}
        		return null;
        	}
        	var tempFileText = self.idf_file_manager.getSavedTextFromEditor();
        	var leafId = self.idf_file_manager.getFileId();
        	var fileLabel = self.findLabelByTreeId(leafId);
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
        	var savedFileText = self.idf_file_manager.getSavedTextFromEditor();
        	var leafId = self.idf_file_manager.getFileId();
        	var savedFile = getSavedFile(self.state.savedFiles, leafId);
        	if(savedFile != null){
        		savedFile.text = savedFileText;
        	}else{       		
        		var label = self.findLabelByTreeId(leafId);
    			var indexedSavedFile = {
    					leafId:leafId,
    					fileLabel:label,
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
        	
        	IDF_OBJMANAGER.loadIdfObjs(trackObjs);     	    	      	   	
        } 
        
      
        this.loadTextForLeafId = function(leafId){
        	var divText = '';
			//if there is temp file for this Id, then show the temp file
			var tempFile = self.state.tempFiles.filter(function(temp){
				return temp.leafId == leafId;
			});
			      	
			if(tempFile.length > 0){
				divText = tempFile[0].text;
				
			}else{
				var savedFile = self.state.savedFiles.filter(function(temp){
					return temp.leafId == leafId;
				});
										
				divText = savedFile.length > 0 ? savedFile[0].text : buildTextForLeafId(leafId);
			}
			return divText;       	
        }
         
        
               
        this.saveTextFile = function(leafId, forceSave){
        	var text_editor = leafId ? self.getTextEditorByLeafId(leafId) : self.text_editor_active;      	
        	var fileState = self.idf_file_manager.loadEditor(text_editor,leafId).getFileState();
        	if(fileState == null){
        		return;
        	}       		        	
         	if(fileState.isDirty || forceSave){
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
        
        
        this.pushToDirtyFiles = function(leafId){
        	self.state.dirtyFiles.push(leafId);
        }
        
        this.removeFromDirtyFiles = function(leafId){
        	var index = self.state.dirtyFiles.indexOf(leafId);
        	if (index > -1) {
        		self.state.dirtyFiles.splice(index, 1);
        	}
        }
        
        this.existsDirtyFile = function(leafId){
        	return self.state.dirtyFiles.includes(leafId);
        }

/*        this.removeTextEditor = function(leafId){
        	var cm = self.getTextEditorByLeafId(leafId);
        	var index = idf_editor.text_editors_index.indexOf(leafId);
        	idf_editor.text_editors_index.splice(index,1);
        	idf_editor.text_editors.splice(index,1);
        }*/
      
        
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