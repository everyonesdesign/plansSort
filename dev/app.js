(function ($) {

//if page has not loaded return
    if (!$("#content").length) return;

//plan blocks
    var $plans = $(".plan.todo"),
        $sortableContainer,
        opacityToSet = .4;

    $plans.dblclick(function (e) {
        if ($(this).css("opacity") == 1) $(this).css("opacity", opacityToSet);
        else $(this).css("opacity", 1);
        writeDataToStorage();
    }).wrapAll("<div class='all-plans-wrapper' id='sortablePlans'></div>");

    $sortableContainer = $("#sortablePlans");
    $sortableContainer.sortable({
        stop: writeDataToStorage //on sortable complete renew data in storage
    });

    if (localStorage["plansOrder"]) { //if order local storage is defined, reorder plans in the storage order. new plans will be positioned on top
        var orderArray = JSON.parse(localStorage["plansOrder"]);
        for (var i = 0; i < orderArray.length; i++) {
            $plans.each(function () {
                if ($(this).children(".plan").attr("plan_id") == orderArray[i]) $(this).detach().appendTo($sortableContainer);
            });
        }
    }

    if (localStorage["plansOpacity"]) { //if opacity local storage is defined apply it
        var opacityArray = JSON.parse(localStorage["plansOpacity"]);
        for (var i = 0; i < opacityArray.length; i++) {
            $(".plan.todo[plan_id='" + opacityArray[i] + "']").parent().css("opacity", opacityToSet);
        }
    }

    writeDataToStorage();
    function writeDataToStorage() { //function which saves current position to the storage
        var orderArray = [],
            opacityArray = [];
        $(".plan-wrapper").each(function () {
            var id = $(this).children(".plan").attr("plan_id");
            orderArray.push(id);
            if ($(this).css("opacity") != 1) opacityArray.push(id);
        });
        localStorage["plansOrder"] = JSON.stringify(orderArray);
        localStorage["plansOpacity"] = JSON.stringify(opacityArray);
    }

})(jQuery);
