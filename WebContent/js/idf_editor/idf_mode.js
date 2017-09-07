(function(mod) {
	if (typeof exports == "object" && typeof module == "object") // CommonJS
		mod(require("../../lib/codemirror"));
	else if (typeof define == "function" && define.amd) // AMD
		define([ "../../lib/codemirror" ], mod);
	else
		// Plain browser env
		mod(CodeMirror);
})
		(function(CodeMirror) {
			"use strict";

			var idf_labels = [], idf_labels_regex, idf_rules;
			function wordRegexp(words) {
				return new RegExp("^((" + words.join(")|(") + "))\\b");
			}

			function getLabelsFromRules(rules) {
				var labels = [];
				var ruleObjects = rules.objects;
				for (var i = 0; i < ruleObjects.length; i++) {
					labels.push(ruleObjects[i].name);
				}
				return labels;
			}

			// CodeMirror.registerHelper("hintWords", "idf", commonKeywords);

			CodeMirror.defineMode("idf",function(config, parserConfig) {
				var indentUnit = config.indentUnit;
				var statementIndent = parserConfig.statementIndent;
				var jsonldMode = parserConfig.jsonld;
				var jsonMode = parserConfig.json || jsonldMode;
				var isTS = parserConfig.typescript;
				var wordRE = parserConfig.wordCharacters || /[\w:*]/;

				var type, content;
				function ret(tp, style, cont) {
					type = tp;
					content = cont;
					return style;
				}
				
				function tokenBase(stream, state) {
					if (idf_labels.length === 0) {
						//idf_labels = getLabelsFromRules(idf_editor.idf_rules)
						idf_labels = idf_editor.idf_rule_manager.getAllLabels();
					}
					;
					var ch = stream.next();
					// number
					if (ch == "."&& stream.match(/^\d+(?:[eE][+\-]?\d+)?/)) {
						return ret("number", "number");
					} else if (/[\[\]{}\(\),;\:\.]/.test(ch)) {
						return ret(ch);
					} else if (ch == "0" && stream.eat(/x/i)) {
						stream.eatWhile(/[\da-f]/i);
						return ret("number", "number");
					} else if (ch == "0" && stream.eat(/o/i)) {
						stream.eatWhile(/[0-7]/i);
						return ret("number", "number");
					} else if (ch == "0" && stream.eat(/b/i)) {
						stream.eatWhile(/[01]/i);
						return ret("number", "number");
					} else if (/\d/.test(ch)) {
						stream
								.match(/^\d*(?:\.\d*)?(?:[eE][+\-]?\d+)?/);
						return ret("number", "number");
					} else if (ch == "!") {
						stream.skipToEnd();
						return ret("comment", "idf-comment");
					} else if (wordRE.test(ch)) {
						stream.eatWhile(wordRE);
						var word = stream.current();
						if ((state.stage === stage.noNodes || state.stage === stage.nodeClosed)
								&& idf_labels.includes(word)) {
							return ret("idf-label",
									"idf-label", word);
						}
						if (word === "No" || word === "Yes") {
							return ret("boolean", "boolean",
									word);
						}
						return ret("variable", "variable", word);
					}
				}
				
				
				// Parser
				function IDFLexical(indented, 
						align, prev) {
					this.indented = indented;
					this.prev = prev;
					if (align != null)
						this.align = align;
				}
				
				
				function registerNodes(curNode){															
					var state = cx.state;
					
					state.nodes = {
							node: curNode,
							next: state.nodes,
					}					
				}
				
				
				var stage = {
					noNodes : 0,
					labelDeclared : 1,
					nodeCreated : 2,
					propertyValueCreated : 3,
					propertyValueClosed : 4,
					nodeClosed : 5,
				}
				

						
				function findNode(nodeLabel) {
					if (idf_editor) {
						var objRule = idf_editor
								.idf_rule_manager.getRuleByLabel(nodeLabel);
						return objRule;
					}
					return null;
				}
				
				function findNodeProperty(node, order) {
					if (node) {
						if(node.name === 'EnergyManagementSystem:Program'){
							if(order === 1){
								return node.fieldlist[0];
							}
							return node.fieldlist[1];
						}					
						return node.fieldlist[order - 1];
					}
					return null;
				}
				
				
				function parseIDFForIDFLabelType(state, style, type, content,stream){
						state.stage = stage.labelDeclared;
						state.curLabel = content;
						return style;							
				}
				
				function parseIDFForCommaType(state, style, type, content,stream){
					if (state.stage === stage.labelDeclared) {
						var node = findNode(state.curLabel);
						var curNode = {
								ref: node,
								lastProp: null,
								curProp: null,
								isValid: true,									
						};

						state.curNode = curNode;
						state.stage = stage.nodeCreated;
						state.closed = false;
						state.curLabel = null;
						state.lexical = new IDFLexical(stream.indentation() + indentUnit,true, state.lexical);
						return style;
					} else if (state.stage === stage.propertyValueCreated) {
						state.stage = stage.propertyValueClosed;
						
						var lastProp = {
								order: state.curNode.curProp.order,
								property: state.curNode.curProp.property,
								value : state.curNode.curProp.value,
								isValid: state.curNode.curProp.isValid,
								lastProp: state.curNode.lastProp,															
						}
						
						state.curNode = {
								curProp : null,
								lastProp : lastProp,
								isValid : state.curNode.isValid && lastProp.isValid,
								ref : state.curNode.ref,

						}	
						return style;
					} else if (state.stage === stage.propertyValueClosed) {
						var order = state.curNode.lastProp.order + 1;
						var property = findNodeProperty(
								state.curNode.ref, order);
						var lastProp = {
							order : order,
							property : property,
							value : null,
							isValid : idf_editor.isValidPropertyValue(property, ''),
							lastProp: state.curNode.lastProp,
							propertyComment : state.curNode.lastProp.propertyComment,
						}
						
						state.curNode = {
								lastProp : lastProp,
								curProp : null,
								isValid: state.curNode.isValid && lastProp.isValid,
								ref: state.curNode.ref,

						}
											
						return style;
					}else if(state.stage === stage.nodeCreated){
						var property = findNodeProperty(
								state.curNode.ref, 1);
						var lastProp = {
								order : 1,
								property : property,
								value : null,
								isValid : idf_editor.isValidPropertyValue(property, ''),
								lastProp: state.curNode.lastProp,
							}
						
						state.curNode ={
								lastProp : lastProp,
								curProp : null,
								isValid: state.curNode.isValid && lastProp.isValid,
								ref: state.curNode.ref,
						}

						state.stage = stage.propertyValueClosed;
						return style;						
					}								
				}
				
				
				
				function parseIDFForVariableType(state, style, type, content,stream){
					stream.takePropertyValue = function() {
						// check the first , or ;
						this.eatWhile(/[^,;]/i);
						if (this.peek() !== ","
								&& this.peek() != ";") {
							return "invalidValue";
						}
						var value = this.current();
						return value;
					}
					
					if (state.stage === stage.nodeCreated
							|| state.stage === stage.propertyValueClosed) {
						if (state.curNode) {
							var curPropValue = stream
									.takePropertyValue();
							if (curPropValue === "invalidValue") {
								state.errors.push("Current value is invalid 1")
								return "error";
							}
							var order = state.curNode.lastProp ? state.curNode.lastProp.order + 1
									: 1;
							var property = findNodeProperty(
									state.curNode.ref,
									order);
							if(!property){
								state.errors.push("Exceed maximum field number");
								state.isValid = false;
								return "error";
							}
							
							var curProp = {
								order : order,
								property : property,
								value : curPropValue,
								isValid : idf_editor.isValidPropertyValue(property,curPropValue),
							};
														
						
							state.curNode = {
									curProp : curProp,
									lastProp : state.curNode.lastProp ? state.curNode.lastProp : null ,
									ref : state.curNode.ref,
									isValid: state.curNode.isValid && (state.curNode.lastProp ? state.curNode.lastProp.isValid : true),
							}
							
/*								if (curProp.property == null) {
								return "error";
							}	*/															
							state.stage = stage.propertyValueCreated;																				
							if(curProp.isValid)
								return style;
							else {
								state.errors.push("Current value is invalid")
								return "error";
							}
						}
					}
					
					
				}
				
				function parseIDFForSemiColonType(state, style, type, content,stream){					
					if (state.stage == stage.propertyValueCreated) {
						if (state.curNode
								&& state.curNode.curProp) {
							var lastProp = {
									order: state.curNode.curProp.order,
									property: state.curNode.curProp.property,
									value : state.curNode.curProp.value,
									isValid: state.curNode.curProp.isValid,
									lastProp: state.curNode.lastProp,
									propertyComment : state.curNode.curProp.propertyComment,
							};
							
							state.curNode = {
									lastProp : lastProp,
									curProp : null,
									ref : state.curNode.ref,
									isValid: state.curNode.isValid && lastProp.isValid,
									
							};
							
							//syncNodes();	
						}
					}else if(state.stage == stage.propertyValueClosed){											
						var order = state.curNode.lastProp.order + 1;
						var property = findNodeProperty(
								state.curNode.ref, order);
							
						 var lastProp = {
								order : order,
								property : property,
								value : null,
								isValid : idf_editor.isValidPropertyValue(property, ''),
								lastProp: state.curNode.lastProp,
								propertyComment: state.curNode.lastProp.propertyComment
							};
						 
						 					 
						 state.curNode = {
								 lastProp : lastProp,
								 curProp : null,
								 ref : state.curNode.ref,
								 isValid : state.curNode.isValid && lastProp.isValid,
						 };						
					}
					
					if(state.stage ===stage.propertyValueCreated ||
							state.stage ===stage.propertyValueClosed){
						
						state.stage = stage.nodeClosed;
						state.lexical = state.lexical ? state.lexical.prev : new IDFLexical(
								indentUnit,true, null);
						
						//node level validation
						var minfield = state.curNode.ref.minfield;
						var numfield = state.curNode.ref.numfield;
						var totalPropOrder = state.curNode.lastProp.order;
						if (totalPropOrder >= minfield
								&& totalPropOrder <= numfield) {
							if(state.curNode.ref.unique === true && state.nodes.next != null){
								state.curNode.isValid = false;
								state.errors.push("Only one node is allowed");
								state.isValid = state.isValid && state.curNode.isValid;
								return "error";
							}else{
								registerNodes(state.curNode);								
								state.isValid  = state.isValid && state.curNode.isValid;
								state.closed = true;
								return style;
							}												
						}						
						state.curNode.isValid = false;
						state.isValid  = state.isValid && state.curNode.isValid;						
					}																			
				}
				
															
				function parseIDF(state, style, type, content,
						stream) {
					
					cx.state = state;
					cx.stream = stream;
					
					//if(state.isValid === true){					
						if (type == "idf-label") {
							if(state.stage === stage.noNodes || state.stage === stage.nodeClosed){
								return parseIDFForIDFLabelType(state, style, type, content, stream);
							}					
						} else if (type == ",") {
							if(state.stage === stage.labelDeclared || state.stage === stage.propertyValueCreated 
									|| state.stage === stage.propertyValueClosed || state.stage === stage.nodeCreated){
								return parseIDFForCommaType(state, style, type, content,stream);
							}			
						} else if (type == "variable" || type == "number"|| type == "boolean") {
							if(state.stage === stage.nodeCreated || state.stage === stage.propertyValueClosed){
								return parseIDFForVariableType(state, style, type, content,stream);
							}			
						} else if (type == ";") {
							if(state.stage === stage.propertyValueClosed
									|| state.stage === stage.propertyValueCreated){
								return parseIDFForSemiColonType(state, style, type, content,stream);
							}		
						}
					//}					
								
					state.errors.push("Invalid text");
					state.isValid  = false;
					return "error";

				}
				
				var cx = {state:null, column:null, marked:null, cc:null};
				
				
				// Interface
				return {
					startState : function(basecolumn) {
						var state = {
							tokenize : tokenBase,
							//lastType : "sof",
							curNode: null,
							curLabel: null,
							stage : stage.noNodes,
							lexical : new IDFLexical(
									indentUnit,true, null),
							nodes : {node:null, next: null},
							closed: true,
							isValid : true,
							errors: [],
						};
						return state;
					},

					token : function(stream, state) {
						if (stream.eatSpace())
							return null;
						var style = state.tokenize(stream,
								state);
						if (type == "comment")
							return style;
						return parseIDF(state, style, type,
								content, stream);
					},
					indent : function(state, textAfter) {
						if (state.tokenize != tokenBase)
							return 0;
						
						return state.lexical.indented;
					}
				}
			});

			CodeMirror.defineMIME("text/x-idf", "idf");

			// var words = function(str) { return str.split(" "); };

		});