(function () {
    button_toggle = [false]

    $("#options-1").hide();

    $( "#button-1" ).click(function() {
        if(button_toggle[0]) {
            $("#dropdown-1").animate({height:"5%"},500);
            $("#header-1").animate({height:"100%"},500);

            $("#options-1").hide();
            button_toggle[0] = false;
        }
        else {
            $("#dropdown-1").animate({height:"30%"},500);
            $("#options-1").show();
            $("#header-1").animate({height:"15%"},500);
            button_toggle[0] = true;
        }

    });

})();
