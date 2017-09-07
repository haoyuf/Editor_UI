/**
 * 
 */

	var IDF_OBJMANAGER = (function(){
		var idf_objs = null;
		
		function findIdfObjsByLabel(label){
			return idf_objs ?  idf_objs.objMap[label.toLowerCase()]: null;
		}
		
		return{
			loadIdfObjs:function(idfObjs){
				idf_objs = idfObjs;
				return idf_objs;
			},
			
			getIdfObjs: function(){
				return idf_objs;
			},
			
			findIdfObjsByLabel: findIdfObjsByLabel,					
		}	
	})();