String.prototype.isEmpty = function() {
    return (this.length === 0 || !this.trim());
};
//Main Variable
var resize_width = 768;
var move_dat = -1;
var move_to;
var edit = 0;
var prev='Main'; //previous folder
var current = "Main"; //current folder
var current_folder_tag; //tag folder
var current_task_number = 0; // tasknum
var current_sort = -1; //current sorting status (-1 no sort)
var moving_multiple_task = 0;
//var currentNode = $()
var sortEndStartFirst = false;// determine sorting or drop event finish first
var move_id //Cause dataTransfer not work properly
var sort_order;
var count = 0; //folder load count
var lists = {}; //receive local Storage
var folderOpen = false;//folder bar open
var changingNode; //detail changed task
var current_task_type = -1;
var current_tasks = [];
const one_day = 1000*60*60*24;
var task_type = ['finish','today','tomorrow','week', 'far'];
var task_type_bound = [[-Infinity, 0], [0,1],[1,2],[2,7],[7,Infinity]];
var current_urgency = 0;

var getDevice = (function(){
    var ua = navigator.userAgent;
    if(ua.indexOf('iPhone') > 0 || ua.indexOf('iPod') > 0 || ua.indexOf('Android') > 0 && ua.indexOf('Mobile') > 0){
        return 'sp';
    }else if(ua.indexOf('iPad') > 0 || ua.indexOf('Android') > 0){
        return 'tab';
    }else{
        return 'other';
    }
})();

//ask permission for sending push notification from browser
if (getDevice=='other'){
  Push.Permission.request();
}


function _retrieveCurrentTaskList(){
  //{name: "hjjhjh", date: "2017-12-07", descrip: "", id: 8, prior: 0}
  var query = '.todolist.all'
  var all_tasks = $(query).find('.workblock')
  var out_tasklist = []
  for(var i = 0; i < all_tasks.length; i++){
    var prep = {}
    //console.log($(all_tasks[i]).find('.task-name'));
    prep['name'] = $(all_tasks[i]).find('.task-name')[0].innerText
    prep['date'] = $(all_tasks[i]).find('.date')[0].innerText
    prep['id'] = $(all_tasks[i]).attr('data-id')
    prep['prior'] = $(all_tasks[i]).attr('prior')
    out_tasklist.push(prep);
  }
  return out_tasklist
}

function sortTask(num){
    var all_task = _retrieveCurrentTaskList();
    /*
    1 - time sort
    2 - prior sort
    3 - alphabet sort
    4 - notyet design
    */
    // function changeUrgency(id, ev){
    //   if(!$(id).hasClass('urgency chosen')){
    //     var truth = current_urgency == undefined
    //     if(!truth) {
    //       $('.urgency').removeClass('chosen')
    //       $(current_urgency).toggleClass('chosen');
    //     }
    //     $(id).toggleClass('chosen');
    //     current_urgency = $(id).attr('num');
    //   }
    // }
    if(current_sort != -1){
      if(current_sort == num) return;
      $('.sort[num='+current_sort+']').removeClass('chosen');
    }
    $('.sort[num='+num+']').toggleClass('chosen');
    current_sort = num;
    switch (num) {
      case 1:
        var time_sort = all_task.sort((a,b) => {
          if(b.date.isEmpty()) return false;
          else if (a.date.isEmpty()) return true;
          else if (a.date > b.date) return true;
          return false
        })
        sort.sort(time_sort.map((a) => {return a.id}))
        break;
      case 2:
        var prior_sort = all_task.sort((a,b) => {
          return a.prior < b.prior;
        })
        sort.sort(prior_sort.map((a) => {return a.id}))
        break;
      case 3:
        var alpha_sort = all_task.sort((a,b) => {
          return a.name > b.name;
        })
        sort.sort(alpha_sort.map((a) => {return a.id}))
        break;
      default:
    }
    sort_order = sort.toArray()
}

function addMultiAlarm(){
  console.log("/Alarm")
  $('#Alarm').append(
    "<input type=\"datetime-local\" class=\"form-control\"id=\"new-alarm\" placeholder=\"date\">"
  );
}
//toggle shortcut box: make a box appear
function addTaskFromShortcut(id){
  var name = $(id).text();
  console.log(id);
  addTodolist(name);
  $.ajax({
      url : '/add',
      type: "POST",
      data: {folder:current, taskname:name, date:'', descrip:''} //folder, taskname, date, descrip
  }).done((data) => {
    console.log(data);
    $('.workblock').last().attr('data-id', data.num);
  });
}

function deleteShortcut(id, ev){
  var del_id = $(id).parent().attr('data-id')
  $.post('/delShortcut', data={id:del_id})
  $(id).parent().remove();
}

function showShortcut(name, id=""){
  $('.shortcutAreaBody').append("<div class = 'namelist' onclick='addTaskFromShortcut(this)' data-id=\""+ id + "\">"+name+
  "<a class = \"delete-shortcut\" onclick=\"event.stopPropagation();deleteShortcut(this, event)\">" + "<span class=\"glyphicon glyphicon-trash\"></span>"+"</a>" + "</div>"
  );
}

function toggleShortcut(){
  $('.shortcut-box').toggleClass("toggled");
}

function loadShortcut(){
  $('.shortcutAreaBody').html("");
  $.post('/loadShortcut').done((data) => {
    for(var i = 0; i < data.length; i++){
      showShortcut(data[i].name, data[i].id);
    }
  });
}
/* end TODO */

function loadDailyReminder(){
  $('.todolist.daily').html('');
  var notask = 1;
  var date = new Date();
  var alarm = new Date();
  var bound_index = 0
  var time_now = Math.floor(date.getTime()/one_day);
  $.post('/getTask').done((data) => {
    while(notask){
      bound_index++;
      if(!(bound_index < task_type_bound.length)) break;
      up_bound = task_type_bound[bound_index][1];
      low_bound = task_type_bound[bound_index][0]
      for(var key in data){
        var tasks = data[key];
        for(var i = 0; i < tasks.length; i++){
          if(tasks[i].date === '') continue;
          var task_date = new Date(tasks[i].date);
          var diff = task_date.getTime()/one_day - time_now;
          console.log(diff, low_bound, up_bound);
          //low_bound <= diff &&
          if(diff < up_bound){
            addTodolistToType(tasks[i].name, 'daily', tasks[i].date, tasks[i].alarm, tasks[i].descrip, tasks[i].id);
            notask = 0;
          }
        }
      }
    }
    if(notask) $('.bound').html(task_type[bound_index]);
  })
}

function closeDaily(){
  $('.daily').css('display', 'none');
}

function init(){
  console.log("js success")
  var windowWidth = $(window).width();
  console.log(windowWidth);
  //Navigation bar
  if(windowWidth >= resize_width){
    console.log('test');
    $("#menu-toggle").css('display','none');
  }
  updateToggle();
//Slide bar
  var sidebar = $(".sidebar-nav");
  sideBarMenuToggle(sidebar);
  displayFolder();
  loadShortcut();
  taskLoad("Main", toggle=false);
  updateSortable();

  //local Storage
  MobileDragDrop.polyfill({
    dragImageTranslateOverride: MobileDragDrop.scrollBehaviourDragImageTranslateOverride
  });
  prev = $(".folder-name")[0]; //initial main folder
  $(prev).parent().parent().css("border-left","10px solid #FF9966");
  mc = new Hammer(document);
  mc.on('swipeleft', (ev) => {
    if(!$(ev.target).parents('.nav-bar').length) toggleTaskTypeRight();
  })
  mc.on('swiperight', (ev) => {
    console.log(ev.target);
    if(!$(ev.target).parents('.nav-bar').length) toggleTaskTypeLeft();
  })
  mc.set({enable:false})

  loadDailyReminder();

}

//change urgency

function changeUrgency(id, ev){
  if(!$(id).hasClass('urgency chosen')){
    var truth = current_urgency == undefined
    if(!truth) {
      $('.urgency').removeClass('chosen')
      $(current_urgency).toggleClass('chosen');
    }
    $(id).toggleClass('chosen');
    current_urgency = $(id).attr('num');
  }
}

//Load folder or not
function clickOnFolder(id, ev){
  ev.preventDefault();
  node = ev.target;
  if(edit == 0 || !moving_multiple_task){
    if($(node).hasClass('folder')){
      //console.log($(node).children('.folder-name')[0].innerText);
      node = $(node).children('.folder-name')[0];
      console.log(node);
      //changeCurrentFolderTag($(node).parent().parent());
      taskLoad(node.innerText, true, node);
      prev = node;
      current_folder_tag = id;
    }
    else if ($(node).hasClass('folder-name')) {
      //changeCurrentFolderTag($(node).parent().parent());
      taskLoad(node.innerText, true, node);
      prev = node;
      current_folder_tag = id;
    }
    else{
      sideBarMenuToggle(node);
    }
  }
  else if(edit == 1 && moving_multiple_task){
    var move_to = $(id).children('.folder-name').text();
    var id_to_move = [];
    var move_lists = [];
    //console.log($('#todo' + move_dat).children('.checkbox-list').children('input')[0].checked);
    var works = $('.workblock');
    move_lists = works.filter((a) => {
      return $(works[a]).children('.checkbox-list').children('input')[0].checked;
    })
    console.log(move_lists);
    id_to_move = move_lists.map((index,a) => {
      a.remove();
      return $(a).attr('data-id');
    }).get();
    if(!$.isEmptyObject(id_to_move))
    $.ajax({
      type: 'POST',
      url: '/moveTo',
      data: {
      folder: move_to,
      name: name,
      now: current,
      move_id: id_to_move
      }
    })
    toggleFolder();
  }
}

//tagged current folder
function changeCurrentFolderTag(node){
  $(prev).parent().parent().css("border-left", "0px");
  $(node).css("border-left", "10px solid #FF9966");
}

//load tasks on page
function taskLoad(folder, toggle = true, node = null){
  console.log('taskload activated')
  current_task_number = 0;
  if(node != null){
    changeCurrentFolderTag($(node).parent().parent());
  }
  current = folder;//change Path
  var content;
  $.ajax({
    url: '/',
    type: 'POST',
    data: {
      load: current
    }
  }).done((data) => {
    $(".todolist.all").html("");
    console.log(data);
    current_tasks = data;
    var now = new Date();
    var time_now = now.getTime();
    var nodate = current_tasks.filter((a) => {return a.date.isEmpty()});
    var havedate = current_tasks.filter((a) => {return !a.date.isEmpty()});
    havedate.sort((a,b) => {if(a.date.isEmpty()) return true;
      return a.date > b.date;})
    for(var i=0; i < havedate.length; i++){
      //addTodolist(name, date="", descrip="", dataid, prior=0, alarm="")
      console.log(havedate[i].id)
      addTodolist(havedate[i].name, havedate[i].date, havedate[i].descrip, havedate[i].id,  havedate[i].prior, havedate[i].alarm);
    }
    for(var i=0; i < nodate.length; i++){
      addTodolist(nodate[i].name, nodate[i].date, nodate[i].descrip, nodate[i].id, nodate[i].prior, nodate[i].alarm);
    }
    var tasks = $('.workblock')
    if(localStorage[folder]){
      sort.sort(JSON.parse(localStorage[folder]));
    }
    else {
      localStorage[folder] = JSON.stringify(sort.toArray());
    }
    var tmp = $($('.todolist.all')).find('.workblock')
    sort_order = $.makeArray(tmp).map((x) => {return $(x).attr('data-id')})
  })
  if($(window).width() < resize_width && toggle) toggleFolder();
}

function clickOnCheckbox(id, ev){
  if(id.checked) {
    if(edit == 0){
      var tmp = $(id).parent().parent('.workblock')[0]
      $('.todolist.done').prepend(tmp.outerHTML)
      tmp.remove();
    }
  }
}

//add Task (Specific)
function addTodolistToType(name, type, date, alarm, descrip, id){
  console.log("loaddaily")
  $('.todolist.' + type).append("<li class=\"workblock\" id=\"todo" + id
    +"\" data-id=" + id
    + ">"
    //+ "<div class=\"job\">"
    + "<span class=\"task-name\">"
    + name
    + "</span>"
    + "<span class=\"checkbox-list\">"
    +  "<input type=\"checkbox\" class=\"checkbox-regular\" onchange=\"clickOnCheckbox(this,event)\">"
    + "</span>"
    + "<span class=\"date\">"
    + date
    + "</span>"
    + "<span class=\"alarm\">"
    + alarm
    + "</span>"
    + "<span class=\"description\">"
    + descrip
    + "</span>"
    //+ "</div>"
    + "</li>");
    // sort_order.push(current_task_number);
    // current_task_number++;
}


function toggleTaskTypeRight(num = 1){
  current_task_type += num
  $('.arrow-left').css('display','block');
  if (current_task_type > task_type.length - 1) {
    current_task_type = task_type.length - 1;
    $('.arrow-right').css('display','none');
  }
  TaskFilter(current_task_type)
}

function toggleTaskTypeLeft(num = 1){
  current_task_type -= num
  $('.arrow-right').css('display','block');
  if (current_task_type < -1) {
    current_task_type = -1;
    $('.arrow-left').css('display','none');
  }
  TaskFilter(current_task_type)
}

function toggleTaskToExact(num){
  current_task_type = num
  switch (num) {
    case -1:
      $('.arrow-right').css('display','block');
      $('.arrow-left').css('display','none');
      break;
    case task_type.length - 1:
      $('.arrow-right').css('display','none');
      $('.arrow-left').css('display','block');
      break;
    default:
      $('.arrow-right').css('display','block');
      $('.arrow-left').css('display','block');
  }
  TaskFilter(num)
}

function TaskFilter(type){
  if(type == -1){
    $('.workblock').css('display', 'block');
    $('#task-type').text('All');
    return
  }
  $('#task-type').text(task_type[type]);
  var interval = task_type_bound[type];
  var upbound = interval[1], lowbound = interval[0];
  var tasks = $('.workblock');
  var date = new Date();
  var time_now = Math.floor(date.getTime()/one_day);
  for(var i = 0; i < tasks.length; i++){
    var task_date = new Date($(tasks[i]).children('.date')[0].innerText);
    var diff = task_date.getTime()/one_day - time_now;
    if(!(diff >= lowbound && diff < upbound)){
      $(tasks[i]).css('display', 'none');
    }
    else{
      $(tasks[i]).css('display', 'block');
    }
  }
}
//add new Folder

function addFolder(){
  var sidebar = $('.folder-lists');
  var name = prompt("Enter Folder Name","Newfolder");
  if(name == null) return false;
  while(name in lists){
    name = prompt("Already exist folder, please try again");
    if(name == null) return false;
  }
  $.post('/addFolder', {name: name});
  if(!name.isEmpty()){
    sidebar.append(
      "<li><a href=\"#\" class=\"folder\" onclick=\"clickOnFolder(this,event)\">"+"<span class=\"folder-name\">"
       + name + "</span>" + "<span class=\"expands\" set=\"0\">&oplus;</span>"
       + "</a></li>"
    );
    $('.folder').attr('ondrop', 'dropTask(this, event)');
    $('.folder').attr('ondragover', 'event.preventDefault()');
    $('.folder').attr('ondragenter','taskEnterFolderArea(this, event)');
    $('.folder').attr('ondragleave','taskLeaveFolderArea(this, event)');
    lists[name] = {};
    localStorage.tasklist = JSON.stringify(lists);
  }
}

//show existing folders

function displayFolder(){
  var sidebar = $('.folder-lists');
  sidebar.html("");
  $.get('/requestFolder',{},(data) => {
    console.log(data)
    for(var key in data){
      console.log(data[key]);
      sidebar.append(
        "<li><a href=\"#\" class=\"folder\" onclick=\"clickOnFolder(this,event)\">" + "<span class=\"folder-name\">" + data[key] + "</span>"
        +"<span class=\"expands\" set=\"0\">&oplus;</span>" + "</a>"
         + "</li>"
      );
    }
    console.log($($('.folder')[0]).parent()[0]);
    changeCurrentFolderTag($($('.folder')[0]).parent()[0]);
    prev = $('.folder-name')[0];
    $('.folder').attr('ondrop', 'dropTask(this, event)');
    $('.folder').attr('ondragover', 'event.preventDefault()');
    $('.folder').attr('ondragenter','taskEnterFolderArea(this, event)');
    $('.folder').attr('ondragleave','taskLeaveFolderArea(this, event)');
    current_folder_tag = $('.folder')[0];
  })
}

//delete folder
function deleteFolder(){
  if(current === "Main"){
    alert("You cannot delete main!");
  }
  else{
    var del = confirm("Are you sure?")
    if(del){
      $.ajax({
        url: '/delfolder',
        data: {
          folder: current
        },
        type: 'POST'
      })
      delete lists[current];
      localStorage.removeItem(current);
      taskLoad("Main", toggle=false);
      current_folder_tag.remove();
      //displayFolder();
      prev = $(".folder-name")[0];
      $(prev).parent().parent().css("border-left","10px solid #FF9966");
      localStorage.tasklist = JSON.stringify(lists);
    }
  }
}

//delete task
function deleteTask(){
  var tick = $(".checkbox-regular");
  var job = $(".workblock");
  var jobName = $('.task-name');
  var i;
  var deletelists = [];
  var delete_id = [];
  for(i = 0; i < tick.length; i++){
    if(tick[i].checked){
      console.log(job[i]);
      var text = jobName[i].innerText;
      //deletelists[text] = i;
      var num = $(job[i]).attr('data-id');
      deletelists.push(num);
      var del_index = sort_order.indexOf(num);
      console.log(num, del_index, sort_order);
      sort_order.splice(del_index, 1);
      //current_tasks.splice(num, 1);
      delete_id.push(num);
      job[i].remove();
      //localStorage.tasklist = JSON.stringify(lists);
    }
  }
  console.log(deletelists);
  if(!$.isEmptyObject(deletelists)){
      $.ajax({
      url : '/del',
      data : {
        lists: deletelists,
        folder: current
      },
      type : "POST"
    })
  }
  moving_multiple_task = 0;
  bottomContainment = $('.todolist.all').offset().bottom;
}

//modal box

function changeTodoDetail(node, modal){
  //console.log(node);
  changingNode = node;
  console.log("changingNode : " + changingNode);
  var taskname = $(node).children(".task-name")[0].innerText;
  var date = $(node).children(".date")[0].innerText;
  var alarm = $(node).children(".alarm")[0].innerText;
  var descrip = $(node).children(".description")[0].innerText;
  current_urgency = $(node).attr('prior')
  $('.urgency').removeClass('chosen')
  //console.log($(modal).find('.urgency[num=' + current_urgency +']')[0]);
  $($(modal).find('.urgency[num=' + current_urgency +']')[0]).toggleClass('chosen')
  $("#new-taskname").val(taskname);
  $("#new-date").val(date);
  $("#new-alarm").val(alarm);
  $("#description").val(descrip);
  modal.style.display = "block";
}

//add task

function addTodolist(name, date="", descrip="", dataid, prior=0, alarm=""){
  $('.todolist.all').append("<li class=\"workblock\" id=\"todo" + dataid
    +"\" data-id=\"" + dataid + "\""
    +"prior=\"" + prior + "\""
    + ">"
    //+ "<div class=\"job\">"
    + "<span class=\"task-name\">"
    + name
    + "</span>"
    + "<span class=\"checkbox-list\">"
    +  "<input type=\"checkbox\" class=\"checkbox-regular\" onchange=\"clickOnCheckbox(this,event)\">"
    + "</span>"
    + "<span class=\"date\">"
    + date
    + "</span>"
    + "<span class=\"alarm\">"
    + alarm
    + "</span>"
    + "<span class=\"description\">"
    + descrip
    + "</span>"
    //+ "</div>"
    + "</li>");
    sort_order.push(current_task_number);
    current_task_number++;
}

function toggleEdit(){
  edit = edit != 1
  $('.nav-bar').toggleClass('edit')
  $('.edit-bar').toggleClass('edit')
  $('.todolist.done').toggleClass('edit')
  $('.delete-shortcut').toggleClass('edit')
}
//set sortable list

function updateSortable(){
  console.log('sort')
  var move = document.getElementsByClassName('todolist all')[0];
  console.log(move);
  sort = Sortable.create(move, {
    animation: 150,
    onStart: function(ev){
      $("#menu-toggle").text("Move here");
      sortEndStartFirst = false;
      console.log(ev.oldIndex, $('.workblock')[ev.oldIndex]);
      console.log($('.todolist.all').children('.workblock'))
      move_id = $($('.todolist.all').children('.workblock')[ev.oldIndex + 1]).attr('data-id');
      console.log(move_id);
      $.post('/test', move_id);
    },
    onEnd: function(){
      $("#menu-toggle").text("Folder");
      $(".folder").css('background-color', '');
      //$('.nav-bar').attr('ondragover','dragOverNav(event)')
      if($('#wrapper').hasClass('toggled')){
        toggleFolder();
      }
      if(sortEndStartFirst){
        $.post('/test', 'sort after');
        if(move_dat != -1 && $('.todolist.all').children('#todo' + move_dat)[0] !== undefined )
          $('.todolist.all').children('#todo' + move_dat)[0].remove();
        move_dat = -1;
        sortEndStartFirst = false;
      }
      else{
        $.post('/test','sort first');
        sortEndStartFirst = true;
      }
    },
    store: {
      get: function(sortable){
        sort_order = sortable.toArray();
        return sortable.toArray();
      },
      set: function(sortable){
        var order = sortable.toArray();
        console.log(JSON.stringify(sort_order),JSON.stringify(order));
        if(current_sort != -1 && JSON.stringify(sort_order) !== JSON.stringify(order)){
          console.log("sort diff")
          $('.sort[num='+current_sort+']').removeClass('chosen');
          current_sort = -1;
        }
        sort_order = order;
        console.log(sort_order)
        localStorage[current] = JSON.stringify(order);
      }
    }
  })
}

function dragOverPage(){
  $('#page-content-wrapper').attr('ondragover', '');
  toggleFolder();
}

function dragOverNav(ev){
  ev.preventDefault();
  if(!folderOpen){
    $('#page-content-wrapper').attr('ondragover', 'dragOverPage()');
    toggleFolder();
  }
}

function taskEnterFolderArea(id, ev){
  ev.preventDefault();
  $(id).css('background','rgba(255,255,255,0.2)');
}

function taskLeaveFolderArea(id, ev){
  ev.preventDefault();
  $(id).css('background', '');
}

function dropTask(id, ev){
  ev.preventDefault();
  var dropOn = id
  move_to = $(dropOn).children(".folder-name")[0].innerText;
  //$.post('/test', {move_to:move_to, move_id:move_id});
  if(move_to !== current){
    move_dat = move_id;
    element = $('.todolist.all').children('#todo' + move_dat)[0];
    var id_to_move = [];
    var move_lists = [];
    id_to_move = [move_id];

    console.log(id_to_move);
    $.ajax({
      type: 'POST',
      url: '/moveTo',
      data: {
      folder: move_to,
      name: name,
      now: current,
      move_id: id_to_move
      }
    })
    if(sortEndStartFirst){
      $.post('/test', 'event after')
      if($('.todolist.all').children('#todo' + move_dat)[0] !== undefined)$('.todolist.all').children('#todo' + move_dat)[0].remove();
      move_dat = -1;
      sortEndStartFirst = false;
    }
    else{
      $.post('/test', 'event first')
      sortEndStartFirst = true;
    }
  }
  else move_dat = -1;
}
//toggle sidebar

function updateToggle(){
  $("#menu-toggle").click(function(e) {
      e.preventDefault();
      toggleFolder();
  });
  $(window).on('click touchstart', function(e){
    if($(e.target).is("#page-content-wrapper")){
      console.log('page-wrap')
      toggleFolder();
    }
  })
}

function toggleFolder(){
  console.log("toggleFolder()");
  if($(window).width() < resize_width){
    $("#wrapper").toggleClass("toggled");
    folderOpen = folderOpen != true;
    moving_multiple_task = 0
  }
}

function changeDisplay(){
  var windowWidth = $(window).width();
  console.log(windowWidth);
  if(windowWidth < resize_width){
      $("#menu-toggle").css('display', 'block');
  } else {
    if(document.getElementById("menu-toggle")){
      $("#menu-toggle").css('display', 'none');
    }
  }
}


function sideBarMenuToggle(node){
  if($(node).attr("set") === "0"){
    $(node).attr("set","1");
    $(node).parent().css("background-color","yellow")
  }else {$(node).parent().css("background-color","black");
    $(node).attr("set","0");
  }
}
//$('table').sortable();

function checkSubString(sub, str){
  var lensub = sub.length;
  var lenstr = str.length;
  str = str.toLowerCase();
  sub = sub.toLowerCase();
  var i = 0, j = 0;
  if(lensub > lenstr) return false;
  for(i = 0; i < lenstr; i++){
    var chr = str[i];
    if(chr == sub[j]){
      j++;
    }
    if(j == lensub){
      return true;
    }
  }
  return false;
}


//Document Loaded
$(document).ready(function(){
  init();
  //window.event.cancelBubble = true
  var topContainment = $('#todoname').offset().top;
  var bottomContainment = $('.todolist.all').offset().bottom;
  console.log($('.folder'));
//Search Box
  $('#tosearch').keyup(function(event){
    console.log("keyup");
    $('.searchResult').empty();
    var list = $(".task-name");
    var i = 0;
    var sub = $(this).val();
    if(sub){
      for(;i < list.length; i++){
        if(!checkSubString(sub, list[i].innerText)){
          $(list[i]).parent().hide();
        }
        else $(list[i]).parent().show();
      }
    }
    else{
      for(;i < list.length;i++) $(list[i]).parent().show();
    }
  })

  $('#search').submit((ev) => {
    ev.preventDefault();
  })
  //add task

//Todolist
  $('#target').on('submit', function(e) {
    var text = $('#todoname').val();
    if(!text.isEmpty()){
      current_tasks.push({'name':text, date:'', alarm:''})
      //lists[current][text] = {'date':'nope'};
      //localStorage.tasklist = JSON.stringify(lists);
      bottomContainment = $('.todolist.all').offset().bottom;
      var postdata = $(this).serializeArray();
      postdata[0][postdata[0].name] = postdata[0].value;
      delete postdata[0]['name'];
      delete postdata[0]['value'];
      postdata[0]['date'] = '';
      postdata[0]['alarm'] = '';
      postdata[0]['folder'] = current;
      postdata[0]['descrip'] = '';
      console.log(postdata);
      addTodolist(text, '', '', '');
      $.ajax({
          url : $(this).attr('action') || window.location.pathname,
          type: "POST",
          data: postdata[0]
      }).done((data) => {
        console.log(data);
        $('.workblock').last().attr('data-id', data.num);
      });
    }
    //addTodolist(text, '', '');
    e.preventDefault();
    $('#todoname').val("");
  });


  //finish task
  $('#delete').click(function(e){
    var tick = $(".checkbox-regular");
    var job = $(".workblock");
    var jobName = $('.task-name');
    var i;
    var deletelists = [];
    var delete_id = [];
    for(i = 0; i < tick.length; i++){
      if(tick[i].checked){
        console.log(jobName[i]);
        var text = jobName[i].innerText;
        //deletelists[text] = i;
        var num = $(job[i]).attr('data-id');
        deletelists.push(num);
        var del_index = sort_order.indexOf(num);
        console.log(num, del_index, sort_order);
        sort_order.splice(del_index, 1);
        //current_tasks.splice(num, 1);
        delete_id.push(num);
        job[i].remove();
        //localStorage.tasklist = JSON.stringify(lists);
      }
    }
    delete_id.sort((x,y) => {return x < y});
    current_task_number -= delete_id.length;
    for(i = 0; i < delete_id.length; i++){
      var del_index = current_tasks.findIndex((a) => {
        return a.id == delete_id[i];
      })
      current_tasks.splice(del_index, 1);
    }
    e.preventDefault();
    if(!$.isEmptyObject(deletelists)){
        $.ajax({
        url : $(this).attr("action") || window.location.pathname,
        data : {
          lists: deletelists,
          folder: current
        },
        type : "POST"
      })
    }
    bottomContainment = $('.todolist.all').offset().bottom;
  });

  //Add date
  var modal = document.getElementById('myModal');
  $('.todolist').click(function(e){
    var node = e.target;
    var upper = $(node).parent()[0]
    console.log(upper);
    if ($(upper).hasClass('todolist daily')) return;
    if($(node).hasClass('task-name') || $(node).hasClass('date')) changeTodoDetail($(node).parent(), modal);
    else if(!$(node).hasClass('checkbox-regular')) changeTodoDetail(node, modal);
    else return;
  })

  $(window).on('click touchstart', function(e){
    if(e.target == modal){
      modal.style.display = "none";
    }
  })


  //edit
  $('#changedetail').submit(function(ev){
    ev.preventDefault();
    var form = $(this);
    var name = form.find("input[id='new-taskname']").val(),
    date = form.find("input[id='new-date']").val(),
    alarm = form.find("input[id='new-alarm']").val(),
    descrip = form.find("textarea[id='description']").val(),
    url = form.attr("action");
    var oldname = $(changingNode).children('.task-name')[0].innerText,
    olddate = $(changingNode).children('.date')[0].innerText,
    oldalarm = $(changingNode).children('.alarm')[0].innerText,
    dataid = $(changingNode).attr('data-id');
    if(!name.isEmpty()) $(changingNode).children('.task-name').text(name);
    else name = oldname;
    console.log();
    //if (!alarm.isEmpty()) alarm = new Date(alarm);
    console.log("alarm!=oldalarm");
    console.log(alarm!=oldalarm);
    console.log(alarm);
    console.log(oldalarm);
    if (alarm!=oldalarm){   // when a new alarm is set
      //alarmdate = new Date(alarm);  //alarm : string, alarmdate : date object
      console.log("new Date(alarm) = %s",new Date(alarm));
      $.ajax({
        url : '/alarm',
        type : "POST",
        data : {taskname:name, alarm:new Date(alarm)}
      }).done((data) => {
        console.log(data);
        $('.workblock').last().attr('data-id', data.num);
      });
    }
    $(changingNode).attr('prior', current_urgency);
    //console.log(jsalarm.getTime());
    $(changingNode).children('.date').text(date);
    $(changingNode).children('.alarm').text(alarm);
    $(changingNode).children('.description').text(descrip);
    //var alarm = jsalarm.getTime();
    data = {taskname:name, date:date, descrip:descrip, dataid:dataid, alarm:alarm, prior:current_urgency};
    console.log(data);
    $.post(url, data);
    var id = parseInt($(changingNode).attr("data-id"));
    // current_tasks[id].name = name;
    // current_tasks[id].date = date;
    modal.style.display = "none";
  });
  $('.shortcut').click(function(){
        $('.shortcutArea').toggle();
    });
  $('.namelist').click(function(){
      alert("go to modal");
  });
  $('.shortcutInput').keypress(
    function(e){
      if (e.keyCode == 13) {
        var newshortcutList = $(this).val();
        if(!newshortcutList.isEmpty()){
          showShortcut(newshortcutList);
          $.post('/addShortcut', {name:newshortcutList}).done((data) => {
            $(".insertNamelist").last().attr('data-id', data.num);
          });
        }
        $(this).val("");
      }
    });
  $('.daily').click((e) => {
    e.stopPropagation();
  })
  $('.close.daily').click((ev) => {
    console.log("close.daily clicked")
    $('.daily').css('display', 'none');
    mc.set({enable:true})
  })
  $('.dailybotton').click(() => {
    console.log("dailybotton clicked");
    $('.daily').css('display', 'block');
    mc.set({enable:false})
  })
});

$(window).load(function() {
  var vWidth = $(window).width();
  var vHeight = $(window).height();
  $('.table > section').css('width', vWidth).css('height', vHeight);
});

$(window).resize(function() {
  var vWidth = $(window).width();
  var vHeight = $(window).height();
  $('.table > section').css('width', vWidth).css('height', vHeight);
});
