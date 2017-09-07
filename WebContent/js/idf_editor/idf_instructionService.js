/**
 * 
 */

var IDF_INSTRUCTIONSERVICE = (function(){
	var cm = null; //codeMirror instance
	
	function loadEditor(editor){
		cm = editor;
	}
	
	function buildViewForSelectedTextInfo(){
		var tokenState = cm.getTokenAt(cm.getCursor());
		if(tokenState.type === "idf-label"){
/*			var obj_rule =  idf_editor.findRulesByLabel(tokenState.string);
			return self.buildViewForLabelInfo(obj_rule);*/
		}else{
			var curProperty = tokenState.state.curNode.curProp;
			return buildViewForPropertyInfo(curProperty.property);
		}				
	}
	
	function buildViewForLabelInfo(obj_rule){
		var labelView = null;
		var labelInfo = {
				name: obj_rule.name,
				format : obj_rule.format,
				memo: obj_rule.memo,
				beginextensible: obj_rule.beginextensible,
				isextensible: obj_rule.isextensible,
				minfield: obj_rule.minfield,
				numfield: obj_rule.numfield,
				required: obj_rule.required,
				unique: obj_rule.unique
	
		}
		return buildViewHTMLForLabelInfo(labelInfo);
	}

	
	
	function buildViewForPropertyInfo(property_rule){
		var propertyView = null	
		var fieldType = property_rule.fieldtype;
		
		if(fieldType == "A"){
			propertyView = buildViewForAttributeFieldType(property_rule);
		}else if(fieldType == "N"){
			propertyView = buildViewForNumericFieldType(property_rule);
		}else{
			alert("there are other field type existed....")
		}
		return propertyView;		
	}
	
	
	function buildViewForAttributeFieldType(property_rule){
		var type = property_rule.type;							
		var propertyInfo = 					
			{
				name: property_rule.name,
				type: property_rule.type,
				key: type==="choice"? property_rule.key : idf_editor.getReferencedValuesByObjList(eval(property_rule.objectlist)),
				objectlist: property_rule.objectlist,
				referencelist: property_rule.referencelist,
				note: property_rule.note,
				required: property_rule.required,										
			};
			
		return buildViewHTMLForAttributeFieldType(propertyInfo);
	}
	
	function buildViewForNumericFieldType(property_rule){
		var propertyInfo = 
			{
				name: property_rule.name,
				type: property_rule.type,
				autocalculatable: property_rule.autocalculatable,
				autosizable: property_rule.autosizable,
				beginofextensible: property_rule.beginofextensible,
				max: property_rule.max,
				min: property_rule.min,
				unit: property_rule.unit,
				unitbased: property_rule.unitbased,	
				note: property_rule.note,
				required: property_rule.required,																					
			};
		return buildViewHTMLForNumericFieldType(propertyInfo);
	}
	
	
	function elt(tag, content, className, style) {
		  var e = document.createElement(tag);
		  if (className) { e.className = className; }
		  if (style) { e.style.cssText = style; }
		  if (typeof content == "string") { e.appendChild(document.createTextNode(content)); }
		  else if (content) { for (var i = 0; i < content.length; ++i) { e.appendChild(content[i]); } }
		  return e
		}
	
	function buildViewHTMLForLabelInfo(labelInfo){
		var nameView = elt('tr',[elt('th', "Name:"), elt('td', labelInfo.name)]);
		var formatView = elt('tr',[elt('th', "Format:"), elt('td', labelInfo.format)]);
		var memoView = elt('tr',[elt('th', "Memo:"), elt('td', labelInfo.memo)]);
		var beginextensibleView = elt('tr',[elt('th', "Begin Extensible:"), elt('td', labelInfo.beginextensible.toString())]);
		var isextensible = elt('tr',[elt('th', "IsExtensible:"), elt('td', labelInfo.isextensible.toString())]);
		var minfieldView = elt('tr',[elt('th', "Minimum Number of Fields:"), elt('td', labelInfo.minfield.toString())]);
		var numfieldView = elt('tr',[elt('th', "Number of Field"), elt('td', labelInfo.numfield.toString())]);
		var requiredView = elt('tr',[elt('th', "Required:"), elt('td', labelInfo.required.toString())]);
		var uniqueView = elt('tr',[elt('th', "Unique:"), elt('td', labelInfo.unique.toString())]);
		
		
		var labelViewHtml = elt('table', [nameView, formatView, memoView, beginextensibleView, 
		                                     isextensible, minfieldView, numfieldView, requiredView, uniqueView]);
		return labelViewHtml;	
	}
	
	
	
	
	function buildViewHTMLForAttributeFieldType(propertyInfo){
		var nameView = elt('tr',[elt('th', "Name:"), elt('td', propertyInfo.name)]);
		var typeView = elt('tr',[elt('th', "Type:"), elt('td', propertyInfo.type)]);
		var keyView = elt('tr',[elt('th', "Choices:"), elt('td', propertyInfo.key.toString())]);
		var objlistView = elt('tr',[elt('th', "object-list:"), elt('td', propertyInfo.objectlist)]);
		var reflistView = elt('tr',[elt('th', "reference-list:"), elt('td', propertyInfo.referencelist)]);
		var noteView = elt('tr',[elt('th', "Note:"), elt('td', propertyInfo.note)]);
		var requiredView = elt('tr',[elt('th', "Required:"), elt('td', propertyInfo.required.toString())]);
		
		var propertyViewHtml = elt('table', [nameView, typeView, keyView, objlistView, reflistView, noteView, requiredView]);
		return propertyViewHtml;
	}
		
	function buildViewHTMLForNumericFieldType(propertyInfo){
		var nameView = elt('tr',[elt('th', "Name:"), elt('td', propertyInfo.name)]);
		var typeView = elt('tr',[elt('th', "Type:"), elt('td', propertyInfo.type)]);
		
		var autoCalcView = elt('tr',[elt('th', "AutoCalculatable:"), elt('td', propertyInfo.autocalculatable.toString())]);
		var autoSizableView = elt('tr',[elt('th', "AutoSizable:"), elt('td', propertyInfo.autosizable.toString())]);
		var beginofextensibleView = elt('tr',[elt('th', "Begin Of Extensible:"), elt('td', propertyInfo.beginofextensible.toString())]);
		var maxView = elt('tr',[elt('th', "Max:"), elt('td', propertyInfo.max)]);
		var minView = elt('tr',[elt('th', "Min:"), elt('td', propertyInfo.min)]);
		var unitView = elt('tr',[elt('th', "Unit:"), elt('td', propertyInfo.unit)]);
		var unitBasedView = elt('tr',[elt('th', "Unit Based:"), elt('td', propertyInfo.unitbased ? propertyInfo.unitbased.toString():"")]);
		var noteView = elt('tr',[elt('th', "Note:"), elt('td', propertyInfo.note)]);
		var requiredView = elt('tr',[elt('th', "Required:"), elt('td', propertyInfo.required.toString())]);
		
		var propertyViewHtml = elt('table', [nameView, typeView, autoCalcView, autoSizableView, beginofextensibleView, 
		                                     maxView, minView, unitView, unitBasedView, noteView, requiredView]);
		return propertyViewHtml;
	}
	
	
	return {
		loadEditor:loadEditor,
		buildViewForSelectedTextInfo : buildViewForSelectedTextInfo,
		
				
	}
	
})();