(function ($) {

//if page has not loaded return
    if (!$("#content").length) return;

//plan blocks
    var $plans = $("[plan_id]"),
        $sortableContainer,
        opacityToSet = .4;

    $plans.dblclick(function (e) {
        if ($(this).css("opacity") == 1) $(this).css("opacity", opacityToSet);
        else $(this).css("opacity", 1);
        writeAllToStorage();
    }).wrapAll("<div id='sortablePlans'></div>");

    $sortableContainer = $("#sortablePlans");
    $sortableContainer.sortable({
        stop: writeAllToStorage //on sortable complete renew data in storage
    });

    if (localStorage["plansOrder"]) { //if order local storage is defined, reorder plans in the storage order. new plans will be positioned on top
        var orderArray = JSON.parse(localStorage["plansOrder"]);
        for (var i = 0; i < orderArray.length; i++) {
            $plans.each(function () {
                if ($(this).attr("plan_id") == orderArray[i]) $(this).detach().appendTo($sortableContainer);
            });
        }
    }

    if (localStorage["plansOpacity"]) { //if opacity local storage is defined apply it
        var opacityArray = JSON.parse(localStorage["plansOpacity"]);
        for (var i = 0; i < opacityArray.length; i++) {
            $plans.filter("[plan_id='" + opacityArray[i] + "']").css("opacity", opacityToSet);
        }
    }

    writeAllToStorage();
    function writeAllToStorage() { //save all the data
        writeOrderToStorage();
        writeOpacityToStorage();
    }
    function writeOrderToStorage() {
        var orderArray = [];
        $("[plan_id]").each(function () { //we have to reselect it to update the structure
            var id = $(this).attr("plan_id");
            orderArray.push(id);
        });
        localStorage["plansOrder"] = JSON.stringify(orderArray);
    }
    function writeOpacityToStorage() {
        var opacityArray = [];
        $plans.each(function () {
            var id = $(this).attr("plan_id");
            if ($(this).css("opacity") != 1) opacityArray.push(id);
        });
        localStorage["plansOpacity"] = JSON.stringify(opacityArray);
    }

})(jQuery);
