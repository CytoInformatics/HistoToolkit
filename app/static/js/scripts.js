(function () {
    button_toggle = [false]

    $("#options-1").hide();
    $("#button-1").addClass("di-selected");

    $( "#button-1" ).click(function() {
        if(button_toggle[0]) {
            $("#options-1").animate({height:"0%"},500);
            $("#options-1").removeClass("do-show");
            $("#button-1").addClass("di-selected");
            button_toggle[0] = false;
        }
        else {
            $("#options-1").show();
            $("#options-1").addClass("do-show");
            $("#options-1").animate({height:"30%"},500);
            $("#button-1").removeClass("di-selected");
            button_toggle[0] = true;
        }

    });


    // NOTE: the code below is just intended as examples. Change it as you see fit!
    var getImageNames = function() {
        console.log("Running: getImageNames!");
        $.get("get-image-names", function(data) {
            console.log(data);
        })
    }
    $("#tab-1").click(getImageNames);

    var setFolder = function() {
        console.log("Running: setFolder!");
        $.post("set-folder", {new_folder: "/home/masonmcgough/Pictures"}, function(data) {
            console.log(data);
        })
    }
    $("#tab-2").click(setFolder);

})();
