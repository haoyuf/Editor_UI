/**
 * 
 */
var branch_list_operation;
var weatherFilesSave = {};

(function(){
	/**************************
	 * Project related events *
	 **************************/
	go_to_projects();
	
	$("#project_new").click(function(){
		project_clear();
		
		$("#project_create_new").show();
	});
	
	$("#project_create").click(function(){
		project_clear();
		$("#project_create_new").show();
		
		var name = $("#project_name").val();
		if(name===''){
			$("#project_name").focus();
			$("#msg").html("Please provide a none empty project name.");
			return;
		}
		
		var des = $("#project_des").val();
		$.ajax({
			type: "POST",
			url: "./ProjectCreate",
			data: {'name':name, 'des':des},
			success: function(data){
				if (data["redirect"]) {
		            window.location.href = data["location"];
		            return;
		        }
				
				if(data['status']==='success'){
					alert("Project create successfully.");
					$("#projects_btn").click();
				}else {
					$("#msg").html(data['error_msg'] || '');
				}
			}
		});
	});
	
	$("#project_list").on("click", ".project_link", function(){
		var project_id = $(this).attr("project_id");
		var project_name = $(this).text();
		
		$("#select_project_id").val(project_id);
		
		$("#project_btns").hide();
		$("#branch_btns").show();
		
		$("#project_canvas").hide();
		$("#branch_canvas").show();
		
		$("#project_child").hide();
		$("#project_btn").text("Project ("+project_name+")");
		$("#projects_child").css({'display':'inline-block'});
		
		//List branches
		go_to_branches();
	});
	
	$("#project_list").on('click', ".project_delete", function(){
		var project_name = $(this).attr('project_name');
		if(confirm('Are you sure to delete '+project_name+' project?')){
			var project_id = $(this).attr('project_id');
			$.ajax({
				type: 'POST',
				url: './ProjectDelete',
				data: {'project_id':project_id},
				success: function(data){
					if (data["redirect"]) {
			            window.location.href = data["location"];
			            return;
			        }
					
					if(data['status']==='success'){
						alert("Project delete successfully");
						$("#projects_btn").click();
					}else {
						alert(data['error_msg']);
					}
				},
				datatype: 'json'
			});
		}
	});
	
	/*************************
	 * Branch related events *
	 *************************/
	
	$("#branch_new").click(function(){
		branch_clear();
		
		var project_id = $("#select_project_id").val();
		var msg = canCreateBranch(project_id);
		if(msg!=='yes'){
			$("#msg").html(msg);
			return;
		}
		
		$("#branch_create_new").show();
	});
	
	$("#branch_create").click(function(){
		var project_id = $("#select_project_id").val();
		
		branch_clear();
		$("#branch_create_new").show();
		
		if($("#branch_name").val()===''){
			$("#branch_name").focus();
			$("#msg").html("Please provide a none empty branch name.");
			return;
		}
		
		if($("#branch_init_model").val()===''){
			$("#branch_init_model").focus();
			$("#msg").html("Please provide an idf file as initial model.");
			return;
		}
		
		var data = new FormData();
		data.append("project_id", $("#select_project_id").val());
		data.append("name", $("#branch_name").val());
		data.append("des", $("#branch_des").val());
		data.append("file", $("#branch_init_model")[0].files[0]);
		$.ajax({
			type: "POST",
			url: "./BranchCreate",
			data: data,
			cache: false,
			contentType: false,
			processData: false,
			success: function(data){
				if (data["redirect"]) {
		            window.location.href = data["location"];
		            return;
		        }
				
				if(data['status']==='success'){
					alert("Branch create successfully.");
					$("#project_btn").click();
				}else {
					$("#msg").html(data['error_msg'] || '');
				}
			}
		});
	});
	
	$("#branch_list").on("click", ".branch_link", function(){
		var project_id = $("#select_project_id").val();
		var branch_id = $(this).attr("branch_id");
		var branch_name = $(this).text();
		
		$("#select_branch_id").val(branch_id);
		
		$("#branch_btns").hide();
		$("#commit_btns").show();
		
		$("#branch_canvas").hide();
		$("#commit_canvas").show();
		
		$("#branch_btn").text("Branch ("+branch_name+")");
		$("#project_child").css({'display':'inline-block'});
		
		//List commits
		go_to_commits();
	});
	
	/*************************
	 * Commit related events *
	 *************************/
	$("#commit_new").click(function(){
		commit_clear();
		
		var project_id = $("#select_project_id").val();
		var msg = canSubmitCommit(project_id);
		if(msg!=='yes'){
			$("#msg").html(msg);
			return;
		}
		
		$("#commit_create_new").show();
	});
	
	$("#commit_create").click(function(){
		var project_id = $("#select_project_id").val();
		var branch_id = $("#select_branch_id").val();
		
		commit_clear();
		$("#commit_create_new").show();
		
		if($("#commit_file").val()===''){
			$("#commit_file").focus();
			$("#msg").html("Please provide a comit idf file.");
			return;
		}
		
		if($("#commit_comment").val()===''){
			$("#commit_comment").focus();
			$("#msg").html("Please provide none empty comment.");
			return;
		}
		
		var data = new FormData();
		data.append("project_id", project_id);
		data.append("branch_id", branch_id);
		data.append("comment", $("#commit_comment").val());
		data.append("file", $("#commit_file")[0].files[0]);
		$.ajax({
			type: "POST",
			url: "./CommitCreate",
			data: data,
			cache: false,
			contentType: false,
			processData: false,
			success: function(data){
				if (data["redirect"]) {
		            window.location.href = data["location"];
		            return;
		        }
				
				if(data['status']==='success'){
					alert("Commit submit successfully.");
					$("#branch_btn").click();
				}else {
					$("#msg").html(data['error_msg'] || '');
				}
			}
		});
	});
	
	$("#commit_list").on("click", ".commit_link", function(event){
		var commit_id = $(this).attr("commit_id");
		$("#select_commit_id").val(commit_id);
		
		var tdPos = $(this).position();
		var tdHeight = $(this).outerHeight();
		$("#commit_menu").css({"left":tdPos.left+"px", "top":(tdPos.top+tdHeight)+"px"});
		$("#commit_menu").show();
		
		tdPos = $(this).position();
		$("#commit_menu").css({"left":tdPos.left+"px"});
		
		event.stopPropagation();
	});
	
	$("#commit_merge_request_send").click(function(){
		var project_id = $("#select_project_id").val();
		var branch_id = $("#select_branch_id").val();
		
		$.ajax({
			type: 'POST',
			url: './MergeRequestList',
			data: {'project_id':project_id, 'branch_id':branch_id, 'type':'send'},
			success: function(data){
				if (data["redirect"]) {
		            window.location.href = data["location"];
		            return;
		        }
				
				if(data['status']==='success'){
					var merge_requests = data['data'];
					if(merge_requests.length>0){
						var table = $("<table cellpadding=\"5\">");
						table.html("<tr><th>Target Branch Name</th><th>Request Commit</th><th>Message</th><th>Status</th><th>Actions</th></tr>");
						
						$.each(merge_requests, function(i, v){
							var status = v['status'];
							
							var actionBtn = '';
							if(status==='Open'||status==='Commented'){
								actionBtn += '<input type="button" class="send_merge_request_compare" mr_id="'+v['mergeRequestId']+'" value="Compare" />';
								actionBtn += '<input type="button" style="margin-left:10px;" class="send_merge_request_withdraw" mr_id="'+v['mergeRequestId']+'" value="Withdrawn" />';
							}
							actionBtn += '<input type="button" style="margin-left:10px;" class="send_merge_request_comments" mr_id="'+v['mergeRequestId']+'" value="Comments" />';
							
							var row = $("<tr>");
							row.html('<td>'+v['targetBranchName']+'</td><td>'+v['requestCommitName']+'</td><td>'+v['message']+'</td><td>'+v['status']+'</td><td>'+actionBtn+'</td>');
							table.append(row);
						});
						
						$("#merge_request_list_container").html(table);
						
						
						$("#merge_request_list_box").css({'top':$("#commit_list").position().top+'px'});
						$("#merge_request_list_box").show();
					}else {
						alert("This branch has no sent merge requests.");
					}
				}else {
					alert(data['error_msg']);
				}
			},
			datatype: 'json'
		});
	});
	$("#commit_merge_request_receive").click(function(){
		var project_id = $("#select_project_id").val();
		var branch_id = $("#select_branch_id").val();
		
		$.ajax({
			type: 'POST',
			url: './MergeRequestList',
			data: {'project_id':project_id, 'branch_id':branch_id, 'type':'receive'},
			success: function(data){
				if (data["redirect"]) {
		            window.location.href = data["location"];
		            return;
		        }
				
				console.log(data);
				
				if(data['status']==='success'){
					var merge_requests = data['data'];
					if(merge_requests.length>0){
						var table = $("<table cellpadding=\"5\">");
						table.html("<tr><th>Request Branch Name</th><th>Request Commit</th><th>Message</th><th>Status</th><th>Actions</th></tr>");
						
						$.each(merge_requests, function(i, v){
							var status = v['status'];
							var actionBtn = '';
							if(status!=='Denied' && status!=='Merged'){
								actionBtn += '<input type="button" class="receive_merge_request_compare" mr_id="'+v['mergeRequestId']+'" value="Compare" />';
								actionBtn += '<input type="button" style="margin-left:10px;" class="receive_merge_request_merge" mr_id="'+v['mergeRequestId']+'" value="Merge" />';
								actionBtn += '<input type="button" style="margin-left:10px;" class="receive_merge_request_deny" mr_id="'+v['mergeRequestId']+'" value="Deny" />';
							}
							actionBtn += '<input type="button" style="margin-left:10px;" class="receive_merge_request_comments" mr_id="'+v['mergeRequestId']+'" value="Comments" />';
							
							var row = $("<tr>");
							row.html('<td>'+v['requestBranchName']+'</td><td>'+v['requestCommitName']+'</td><td>'+v['message']+'</td><td>'+v['status']+'</td><td>'+actionBtn+'</td>');
							table.append(row);
						});
						
						$("#merge_request_list_container").html(table);
						
						
						$("#merge_request_list_box").css({'top':$("#commit_list").position().top+'px'});
						$("#merge_request_list_box").show();
					}else {
						alert("This branch has no sent merge requests.");
					}
				}else {
					alert(data['error_msg']);
				}
			},
			datatype: 'json'
		});
	});
	$("#merge_request_list_box").on('click', '.send_merge_request_compare', function(){
		var project_id = $("#select_project_id").val();
		var mr_id = $(this).attr("mr_id");
		
		window.open('./MergeRequestCompare.html?project_id='+project_id+"&mr_id="+mr_id, '_blank');
	});
	$("#merge_request_list_box").on('click', '.receive_merge_request_compare', function(){
		var project_id = $("#select_project_id").val();
		var mr_id = $(this).attr("mr_id");
		
		window.open('./MergeRequestCompare.html?project_id='+project_id+"&mr_id="+mr_id, '_blank');
	});
	$("#merge_request_list_box").on('click', '.receive_merge_request_merge', function(){
		var project_id = $("#select_project_id").val();
		var mr_id = $(this).attr("mr_id");
		
		window.open('./MergeRequestMerge.html?project_id='+project_id+"&mr_id="+mr_id, '_blank');
	});
	$("#merge_request_list_box").on('click', '.receive_merge_request_comments', function(){
		var project_id = $("#select_project_id").val();
		var mr_id = $(this).attr("mr_id");
		
		window.open('./MergeRequestComments.html?project_id='+project_id+"&mr_id="+mr_id, '_blank');
	});
	$("#merge_request_list_box").on('click', '.send_merge_request_comments', function(){
		var project_id = $("#select_project_id").val();
		var mr_id = $(this).attr("mr_id");
		
		window.open('./MergeRequestComments.html?project_id='+project_id+"&mr_id="+mr_id, '_blank');
	});
	$("#merge_request_list_box").on('click', '.send_merge_request_withdraw', function(){
		var project_id = $("#select_project_id").val();
		var mr_id = $(this).attr("mr_id");
		$.ajax({
			type: 'POST',
			url: './MergeRequestWithdraw',
			data: {'project_id':project_id, 'mr_id':mr_id},
			success: function(data){
				if (data["redirect"]){
		            window.location.href = data["location"];
		            return;
		        }
				
				if(data['status']==='success'){
					$("#commit_merge_request_send").click();
				}else {
					alert(data['error_msg']);
				}
			},
			datatype: 'json'
		});
	});
	$("#merge_request_list_box").on('click', '.receive_merge_request_deny', function(){
		var project_id = $("#select_project_id").val();
		var mr_id = $(this).attr("mr_id");
		$.ajax({
			type: 'POST',
			url: './MergeRequestDeny',
			data: {'project_id':project_id, 'mr_id':mr_id},
			success: function(data){
				if (data["redirect"]){
		            window.location.href = data["location"];
		            return;
		        }
				
				if(data['status']==='success'){
					$("#commit_merge_request_receive").click();
				}else {
					alert(data['error_msg']);
				}
			},
			datatype: 'json'
		});
	});
	
	/*************************
	 * Commit Menu Functions *
	 *************************/
	$("#commit_view").click(function(){
		window.open('./IDFViewer.html', '_blank');
	});
	$("#commit_download").click(function(){
		var project_id = $("#select_project_id").val();
		var branch_id = $("#select_branch_id").val();
		var commit_id = $("#select_commit_id").val();
		window.open('./CommitDownload?project_id='+project_id+"&branch_id="+branch_id+"&commit_id="+commit_id, '_blank');
	});
	$("#commit_merge").click(function(){
		get_branches(assemble_branches_select_branch);
		
		branch_list_operation = merge_list;
		
		$("#branch_list_box").css({'top':$("#commit_list").position().top+'px'});
		$("#branch_list_box").show();
	});
	$("#commit_compare").click(function(){
		get_branches(assemble_branches_compare);
		
		branch_list_operation = merge_list;
		
		$("#branch_list_box").css({'top':$("#commit_list").position().top+'px'});
		$("#branch_list_ctrl_back").hide();
		$("#branch_list_box").show();
	});
	$("#branch_list_box").on('click', '.commit_select_compare', function(){
		var project_id = $("#select_project_id").val();
		var cmp_branch_id = $(this).attr("branch_id");
		var cmp_commit_id = $(this).attr("commit_id");
		var base_branch_id = $("#select_branch_id").val();
		var base_commit_id = $("#select_commit_id").val();
		
		window.open('./CommitCompare.html?project_id='+project_id+"&cmp_branch_id="+cmp_branch_id+"&cmp_commit_id="+cmp_commit_id+"&base_branch_id="+base_branch_id+"&base_commit_id="+base_commit_id, '_blank');
	});
	$("#commit_fork").click(function(){
		var commit_id = $("#select_commit_id").val();
		$("#fork_branch_box_commit_name").html($(".commit_link[commit_id="+commit_id+"]").html());
		$("#fork_branch_new_branch_name").val('');
		$("#fork_branch_new_branch_des").val('');
		
		$("#fork_branch_box").css({'top':$("#commit_list").position().top+'px'});
		$("#fork_branch_box").show();
	});
	$("#fork_branch_box").on('click', '#fork_branch_submit', function(){
		var new_branch_name = $("#fork_branch_new_branch_name").val();
		if(new_branch_name===''){
			alert('Please provide a non empty new branch name.');
			return;
		}
		
		var new_branch_des = $("#fork_branch_new_branch_des").val();
		$.ajax({
			type: 'POST',
			data: {'project_id':$("#select_project_id").val(), 'branch_id':$("#select_branch_id").val(), 'commit_id':$("#select_commit_id").val(), 'new_branch_name':new_branch_name, 'new_branch_des':new_branch_des},
			url: './ForkBranch',
			success: function(data){
				if (data["redirect"]){
		            window.location.href = data["location"];
		            return;
		        }
				
				if(data['status']==='success'){
					alert('Fork Branch Success');
					$("#fork_branch_box").hide();
					$("#project_btn").click();
				}else {
					alert(data['error_msg']);
				}
			},
			datatype: 'json'
		});
	});
	$("#fork_branch_box").on('click', '#fork_branch_cancel', function(){
		$("#fork_branch_box").hide();
	});
	$("#commit_pull").click(function(){
		get_branches(assemble_branches_pull);
		
		branch_list_operation = merge_list;
		
		$("#branch_list_box").css({'top':$("#commit_list").position().top+'px'});
		$("#branch_list_ctrl_back").hide();
		$("#branch_list_box").show();
	});
	
	$("#commit_run").click(function(){
		$("#IDFWeather").show();
		$("#IDFWeather").css({'top':$("#commit_list").position().top+'px'});
	});
	
	/*****************************
	 * Navigation Link Functions *
	 *****************************/
	$("#projects_btn").click(function(){
		go_to_projects();
	});
	$("#project_btn").click(function(){
		go_to_branches();
	});
	$("#branch_btn").click(function(){
		go_to_commits();
	});
	
	/************************
	 * Branch List Listener *
	 ************************/
	$("#branch_list_box").on('click', '.branch_select', function(){
		$(".branch_select").removeClass('branch_select_selected');
		$(this).addClass('branch_select_selected')
		branch_list_operation($(this).attr("id"));
	});
	$("#branch_list_box").on('click', '.branch_select_submit_btn', function(){
		var project_id = $("#select_project_id").val();
		var cmp_branch_id = $("#select_branch_id").val();
		var commit_id = $("#select_commit_id").val();
		
		var base_branch_id = $(this).attr("branch_id");
		var comment = $("#branch_select_comment_"+base_branch_id).val();
		
		$.ajax({
			type: 'POST',
			data: {'project_id':project_id, 'commit_id':commit_id, 'base_branch_id':base_branch_id, 'cmp_branch_id':cmp_branch_id, 'comment':comment},
			url: './MergeRequestCreate',
			success: function(data){
				if (data["redirect"]) {
		            window.location.href = data["location"];
		            return;
		        }
				
				$("#branch_list_box").hide();
				if(data['status']==='success'){
					alert('Create merge request successfully!');
				}else {
					alert(data['error_msg']);
				}
			},
			datatype: 'json'
		});
	});
	$("#branch_list_box").on('click', '.branch_select_compare', function(){
		var branchId = $(this).attr("id");
		
		$.ajax({
			type:'POST',
			url:'./CommitList',
			data:{'project_id':$("#select_project_id").val(), 'branch_id':$(this).attr("id")},
			success: function(data){
				if (data["redirect"]) {
		            window.location.href = data["location"];
		            return;
		        }
				
				if(data['status']==='success'){
					var commits = data['data'];
					if(commits.length>0){
						var table = $("<table cellpadding='5'>");
						table.html("<tr><th>Commit Date Time</th><th>Commit Comment</th><th>Committed By</th><th>Commit Type</th><th>The Other Branch*</th><th>The Other Commit Comment</th></tr>");
						
						$.each(commits, function(i,v){
							var row = $("<tr class='commit_select_compare' branch_id='"+branchId+"' commit_id='"+v['commit_id']+"'>");
							row.html('<td>'+v['commit_date']+'</td>'
									+'<td>'+v['commit_comment']+'</td>'
									+'<td>'+v['commit_user']+'</td>'
									+'<td>'+v['commit_type']+'</td>'
									+'<td>'+v['commit_other_branch']+'</td>'
									+'<td>'+v['commit_other_branch_commit_comment']+'</td>');
							table.append(row);
						});
						
						var row = $("<tr>").html("<td colspan='6'>*: If commit type is MERGED, the other branch is request branch. If commit type is PULL, the other branch is pulled branch. If commit type is FORKED, the other branch is forked branch. Otherwise, the other branch and commit is empty.</td>");
						table.append(row);
						
						$("#branch_list_container").html(table);
						$("#branch_list_ctrl_back").click(function(){
							$("#commit_compare").click();
						});
						$("#branch_list_ctrl_back").show();
					}else {
						$("#msg").html("There is no commit in selected branch.");
					}
				}else {
					$("#msg").html(data['error_msg'] || '');
				}
			}
		});		
	});
	$("#branch_list_box").on('click', '.branch_select_pull', function(){
		var project_id = $("#select_project_id").val();
		var pull_branch_id = $(this).attr("id");
		var dest_branch_id = $("#select_branch_id").val();
		var dest_commit_id = $("#select_commit_id").val();
		
		window.open('./BranchPull.html?project_id='+project_id+'&pull_branch_id='+pull_branch_id+'&dest_branch_id='+dest_branch_id+'&dest_commit_id='+dest_commit_id, '_blank');
	});
	
	/*******************
	 * Other Functions *
	 *******************/
	$("body").click(function(){
		$("#commit_menu").hide();
	});
	$("#branch_list_ctrl_cancel").click(function(){
		$("#branch_list_box").hide();
	});
	$("#merge_request_list_ctrl_cancel").click(function(){
		$("#merge_request_list_box").hide();
	});
	$("#weather_state").on('change', function(){
		$("#weatherFile").html("");
		var state = $(this).val();
		if(state !== "0"){
			var weatherFiles = weatherFilesSave[state];
			
			if(weatherFiles === undefined || weatherFiles === ""){
				$.ajax({
					url: './WeatherFileLister?state='+state,
					success: function(data){
						if (data["redirect"]) {
				            window.location.href = data["location"];
				            return;
				        }
						
						if(data['status']==='success'){
							weatherFiles = data['data'];
							prefix = data['prefix'];
							
							weatherFilesSave[state] = weatherFiles;
						}else {
							alert(data["error_msg"]);
						}
					}, 
					dataType: 'json',
					async: false    // code after ajax needs the ajax result
				});
			}
			
			var htmlCode = "";
			$.each(weatherFiles, function(i, v){
				htmlCode += "<option value='"+v+"'>"+v+"</option>";
			});
			$("#weatherFile").html(htmlCode);
		}
	});
	$("#run_sim_weather_submit").click(function(){
		var selected = $("#weatherFile").val();
		if(selected===null || selected===undefined || selected===''){
			alert("Please select a weather file for the simulation.");
		}else {
			$("#IDFWeather").hide();
			
			$.ajax({
				type: 'POST',
				data: {'project_id':$("#select_project_id").val(), 'branch_id':$("#select_branch_id").val(), 'commit_id':$("#select_commit_id").val(), 'weather_file':selected},
				url: './CommitRunSim',
				success: function(data){
					if (data["redirect"]){
			            window.location.href = data["location"];
			            return;
			        }
					
					if(data['status']==='success'){
						$("#sim_status_content").html('');
						$("#sim_status").css({'top':$("#commit_list").position().top+'px'});
						$("#sim_status").show();
						
						getSimStatus(data['requestId'], 'Status');
					}else {
						alert(data['error_msg']);
					}
				},
				datatype: 'json'
			});
		}
	});
	$("#run_sim_weather_cancel").click(function(){
		$("#IDFWeather").hide();
	});
	$("#sim_status_content").on('click', '.sim_status_close', function(){
		$("#sim_status").hide();
	});
})();

/*****************************
 * Project related functions *
 *****************************/
function go_to_projects(){
	project_clear();
	$.ajax({
		type: "GET",
		url: "./ProjectList",
		success: function(data){
			if (data["redirect"]) {
	            window.location.href = data["location"];
	            return;
	        }
			
			if(data['status']==='success'){
				var projects = data['data'];
				if(projects.length>0){
					var table = $("<table class='project_list'>");
					table.html("<tr><th>Project Name</th><th>Project Description</th><th>Priviledge</th><th>Action</th></tr>");
					
					$.each(projects, function(i,v){
						var row = $("<tr>");
						row.html('<td>'+make_project_link(v['project_name'], v['project_id'])+'</td>'
								+'<td>'+v['project_des']+'</td><td>'+v['project_priviledge']+'</td>'
								+'<td><input type="button" value="Delete" project_id="'+v['project_id']+'" project_name="'+v['project_name']+'" class="project_delete" /></td>');
						table.append(row);
					});
						
					$("#project_list").html(table);
				}else {
					$("#msg").html("You are not participated in any project.");
				}
			}else {
				$("#msg").html(data['error_msg'] || '');
			}
		},
		dataType: 'json'
	});
}
function make_project_link(project_name, project_id){
	var link = $("<span>");
	link.attr("class","project_link").attr("project_id", project_id).text(project_name);
	return link.prop('outerHTML');
}
function project_clear(){
	$("#branch_canvas").hide();
	$("#commit_canvas").hide();
	$("#project_canvas").show();
	
	$("#branch_btns").hide();
	$("#commit_btns").hide();
	$("#project_btns").show();
	
	$("#projects_child").hide();
	
	$("#msg").html("");
	$("#project_list").html("");
	$("#project_create_new").hide();
	
	$("#branch_list_box").hide();
	$("#merge_request_list_box").hide();
	$("#fork_branch_box").hide();
}

/****************************
 * Branch related functions *
 ****************************/
function get_branches(call_back){
	var project_id = $("#select_project_id").val();
	$.ajax({
		type: "POST",
		url: "./BranchList",
		data: {'project_id':project_id},
		success: function(data){
			if (data["redirect"]) {
	            window.location.href = data["location"];
	            return;
	        }
			
			if(data['status']==='success'){
				var branches = data['data'];
				call_back(branches);
			}else {
				$("#msg").html(data['error_msg'] || '');
			}
		}
	});
}
function assemble_branches_branches_panel(branches){
	if(branches.length>0){
		var table = $("<table class='branch_list'>");
		table.html("<tr><th>Branch Name</th><th>Branch Description</th><th>Parent Branch Name*</th></tr>");
		
		$.each(branches, function(i,v){
			var row = $("<tr>");
			row.html('<td>'+make_branch_link(v['branch_name'], v['branch_id'])+'</td>'
					+'<td>'+v['branch_des']+'</td><td>'+v['branch_parent']+'</td>');
			table.append(row);
		});
		
		var row = $("<tr>").html("<td colspan='3'>*: Root branch's parent branch name is empty.</td>");
		table.append(row);
		
		$("#branch_list").html(table);
	}else {
		$("#msg").html("There is no existing branch.");
	}
}
function assemble_branches_select_branch(branches){
	if(branches.length>0){
		var table = $("<table cellpadding=\"5\">");
		table.html("<tr><th>Branch Name</th><th>Branch Description</th><th>Parent Branch Name*</th></tr>");
		
		$.each(branches, function(i,v){
			var row = $("<tr class=\"branch_select\" id=\""+v['branch_id']+"\">");
			row.html('<td>'+v['branch_name']+'</td>'
					+'<td>'+v['branch_des']+'</td><td>'+v['branch_parent']+'</td>');
			table.append(row);
			
			var comment_row = $("<tr class=\"branch_select_submit\" id=\"branch_select_"+v['branch_id']+"\">");
			comment_row.html("<td colspan=\"3\"><textarea id=\"branch_select_comment_"+v['branch_id']+"\"></textarea><br/>"
					+"<input type=\"button\" class=\"branch_select_submit_btn\" branch_id=\""+v['branch_id']+"\" value=\"Submit Merge Request\" /></td>");
			table.append(comment_row);
		});
		
		var row = $("<tr>").html("<td colspan='3'><i>*: Root branch's parent branch name is empty.<i></td>");
		table.append(row);
		
		$("#branch_list_container").html(table);
	}else {
		$("#msg").html("There is no existing branch.");
	}
}
function assemble_branches_compare(branches){
	if(branches.length>0){
		var table = $("<table cellpadding=\"5\">");
		table.html("<tr><th>Branch Name</th><th>Branch Description</th><th>Parent Branch Name*</th></tr>");
		
		$.each(branches, function(i,v){
			var row = $("<tr class=\"branch_select_compare\" id=\""+v['branch_id']+"\">");
			row.html('<td>'+v['branch_name']+'</td>'
					+'<td>'+v['branch_des']+'</td><td>'+v['branch_parent']+'</td>');
			table.append(row);
		});
		
		var row = $("<tr>").html("<td colspan='3'><i>*: Root branch's parent branch name is empty.<i></td>");
		table.append(row);
		
		$("#branch_list_container").html(table);
	}else {
		$("#msg").html("There is no existing branch.");
	}
}
function assemble_branches_pull(branches){
	if(branches.length>0){
		var table = $("<table cellpadding=\"5\">");
		table.html("<tr><th>Branch Name</th><th>Branch Description</th><th>Parent Branch Name*</th></tr>");
		
		$.each(branches, function(i,v){
			var row = $("<tr class=\"branch_select_pull\" id=\""+v['branch_id']+"\">");
			row.html('<td>'+v['branch_name']+'</td>'
					+'<td>'+v['branch_des']+'</td><td>'+v['branch_parent']+'</td>');
			table.append(row);
		});
		
		var row = $("<tr>").html("<td colspan='3'><i>*: Root branch's parent branch name is empty.<i></td>");
		table.append(row);
		
		$("#branch_list_container").html(table);
	}else {
		$("#msg").html("There is no existing branch.");
	}
}
function go_to_branches(){
	branch_clear();
	get_branches(assemble_branches_branches_panel)
}
function make_branch_link(branch_name, branch_id){
	var link = $("<span>");
	link.attr("class","branch_link").attr("branch_id", branch_id).text(branch_name);
	return link.prop('outerHTML');
}
function branch_clear(){
	$("#commit_canvas").hide();
	$("#project_canvas").hide();
	$("#branch_canvas").show();
	
	$("#commit_btns").hide();
	$("#project_btns").hide();
	$("#branch_btns").show();
	
	$("#project_child").hide();
	
	$("#msg").html("");
	$("#branch_list").html("");
	$("#branch_create_new").hide();
	
	$("#branch_list_box").hide();
	$("#merge_request_list_box").hide();
	$("#fork_branch_box").hide();
}

/****************************
 * Commit related functions *
 ****************************/
function go_to_commits(){
	commit_clear();
	
	$.ajax({
		type:'POST',
		url:'./CommitList',
		data:{'project_id':$("#select_project_id").val(), 'branch_id':$("#select_branch_id").val()},
		success: function(data){
			if (data["redirect"]) {
	            window.location.href = data["location"];
	            return;
	        }
			
			if(data['status']==='success'){
				var commits = data['data'];
				if(commits.length>0){
					var table = $("<table class='commit_list'>");
					table.html("<tr><th>Commit Date Time</th><th>Commit Comment</th><th>Committed By</th><th>Commit Type</th><th>The Other Branch*</th><th>The Other Commit Comment</th></tr>");
					
					$.each(commits, function(i,v){
						var row = $("<tr>");
						row.html('<td>'+v['commit_date']+'</td>'
								+make_commit_cell(v['commit_comment'], v['commit_id'])
								+'<td>'+v['commit_user']+'</td>'
								+'<td>'+v['commit_type']+'</td>'
								+'<td>'+v['commit_other_branch']+'</td>'
								+'<td>'+v['commit_other_branch_commit_comment']+'</td>');
						table.append(row);
					});
					
					var row = $("<tr>").html("<td colspan='6'>*: If commit type is MERGED, the other branch is request branch. If commit type is PULL, the other branch is pulled branch. If commit type is FORKED, the other branch is forked branch. Otherwise, the other branch and commit is empty.</td>");
					table.append(row);
					
					$("#commit_list").html(table);
				}else {
					$("#msg").html("There is no existing commit.");
				}
			}else {
				$("#msg").html(data['error_msg'] || '');
			}
		}
	});
}
function make_commit_cell(commit_comment, commit_id){
	var link = $("<td>");
	link.attr("class","commit_link").attr("commit_id", commit_id).text(commit_comment);
	return link.prop('outerHTML');
}
function commit_clear(){
	$("#project_canvas").hide();
	$("#branch_canvas").hide();
	$("#commit_canvas").show();
	
	$("#project_btns").hide();
	$("#branch_btns").hide();
	$("#commit_btns").show();
	
	$("#msg").html("");
	$("#commit_list").html("");
	$("#commit_create_new").hide();
	
	$("#branch_list_box").hide();
	$("#merge_request_list_box").hide();
	$("#fork_branch_box").hide();
}
function getSimStatus(requestId, type){
	if(type==='Status' || type==='Error'){
		$.ajax({
			type:'POST',
			url:'./CommitSimStatus',
			data:{'request_id':requestId, 'request_type':type},
			success: function(data){
				if (data["redirect"]) {
		            window.location.href = data["location"];
		            return;
		        }
	
				if(data['status']==='success'){
					var content = data['res'];
					if(type==='Error'){
						content = "<span style='color:red;'>"+content+"</span>";
					}
					$("#sim_status_content").append(content);
					
					var nextType = type;
					if(data['isFinished']){
						nextType = type==='Status' ? 'Error' : type==='Error' ? 'html' : 'Unknown';
					}
					setTimeout(function(){
						getSimStatus(requestId, nextType);
					}, 1000);
				}else {
					alert(data['error_msg']);
				}
			},
			datatype: 'json'
		});
	}else {
		$("#sim_status_content").append("Download "+type+" file...<br/>");
		window.open('./CommitSimStatus?request_id='+requestId+"&request_type="+type, '_blank');
		
		if(type==='html'){
			setTimeout(function(){
				getSimStatus(requestId, 'err');
			}, 1000);
		}else {
			var btn = $("<input>").attr("type", "button").attr("value", "Close").attr("class", "sim_status_close");
			$("#sim_status_content").append(btn);
		}
	}
}
/*********************
 * Utility functions *
 *********************/
function canCreateBranch(project_id){
	var msg = "";
	$.ajax({
		method: 'GET',
		url: 'UserPriviledgeCheck?right=create_branch&project_id='+project_id,
		success: function(data){
			if (data["redirect"]) {
	            window.location.href = data["location"];
	            return;
	        }
			
			if(data['status']==='success'){
				msg = data['hasRight'] ? "yes" : "You are not authorized to create branch in this project.";
			}else {
				msg = data['error_msg'];
			}
		},
		error: function(data){
			msg = "Check create branch priviledge encounter error";
		},
		async: false
	});
	return msg;
}
function canSubmitCommit(project_id){
	var msg = "";
	$.ajax({
		method: 'GET',
		url: 'UserPriviledgeCheck?right=submit_commit&project_id='+project_id,
		success: function(data){
			if (data["redirect"]) {
	            window.location.href = data["location"];
	            return;
	        }
			
			if(data['status']==='success'){
				msg = data['hasRight'] ? "yes" : "You are not authorized to create branch in this project.";
			}else {
				msg = data['error_msg'];
			}
		},
		error: function(data){
			msg = "Check create branch priviledge encounter error";
		},
		async: false
	});
	return msg;
}

/*****************************
 * Version Control Functions *
 *****************************/
function merge_list(branch_id){
	$(".branch_select_submit").hide();
	$("#branch_select_"+branch_id).show();
}
