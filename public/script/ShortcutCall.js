function addTaskFromShortcut(){
    alert(100)
}
$(document).ready(function(){
    $('.shortcut').click(function(){
        $('.shortcutArea').toggle();
        $('.shortcutAreaBody').toggle();
        $('.shortcutAreaHead').toggle();
    });
    $('.namelist').click(function(){
        alert("go to modal");
    });
    $('textarea').keypress(
        function(e){
            if (e.keyCode == 13) {
                var newshortcutList = $(this).val();
                // alert(newshortcutList);
                $(this).val('');
                $("<div class = 'namelist' onclick='addTaskFromShortcut()'>"+newshortcutList+"</div>").insertAfter(".insertNamelist");
                
            }
        });
});