(function ($) {

//if page has not loaded return
    if (!$("#content").length) return;

//plan blocks
    var $plans = $("[plan_id]"),
        opacityToSet = .4,
        groupPlans = localStorage["groupPlans"]==1 || false;

    $plans
        .append("<div class='plan-icons'>" +
            "<div class='plan-icon plan-changeOpacity'></div>" +
            "<div class='plan-icon plan-moveHandle'></div>" +
        "</div>")
        .wrapAll("<div class='plansGeneralWrapper'></div>");

    $(".plan-changeOpacity").on("click", function() {
        var $plan = $(this).closest("[plan_id]");
        if ($plan.css("opacity") == 1) $plan.css("opacity", opacityToSet);
        else $plan.css("opacity", 1);
        writeAllToStorage();
    });

    $.fn.customSortable = function () {
        $(this).sortable({
            axis: "y",
            tolerance: "pointer",
            handle: ".plan-moveHandle",
            stop: writeAllToStorage //on sortable complete renew data in storage
        });
    };

    $(".plansGeneralWrapper").before("<div class='plansGroupMode'>" +
        "<label><input id='plansSortToggle' type='checkbox'" + (groupPlans==1 ? " checked" : "") + "> группировать по сайтам</label>" +
    "</div>");

    $("#plansSortToggle").change(function() {
        if (groupPlans==1) {
            localStorage["groupPlans"] = 0;
        } else {
            localStorage["groupPlans"] = 1;
        }
        window.location.reload();
    });


    if (groupPlans) {
        var groups = {};
        $plans.each(function() {
            var thisGroup = $(this).attr("object_id");
            if (!groups[thisGroup]) {
                groups[thisGroup] = {};
                groups[thisGroup].domain = $(this).find(".site-domain").text();
                groups[thisGroup].number = 1;
            } else {
                groups[thisGroup].number++;
            }
        });

        $.each(groups, function(key, value) {
            var $wrapper = $("<div class='plansGroupWrapper' data-object-id='" + key + "'></div>");
            $("[plan_id][object_id='" + key + "']")
                .prependTo($(".plansGeneralWrapper"))
                .wrapAll($wrapper);
            $(".plansGroupWrapper[data-object-id='" + key + "']").prepend("<div class='plansGroupWrapper-info'>" +
                "<span><a href='/staff/sites/?site_id=" + key + "'>Сайт #" + key + "</a></span>" +
                "<span class='domainName'><a href='http://" + value.domain + "'>" + value.domain + "</a></span>" +
                "<span>Количество планов: " + value.number + "</span>" +
                "<span class='plansGroupToggle'><a href='javascript:;'>Свернуть/развернуть</a></span>" +
            "</div>");
        });

        $(".plansGroupToggle").on("click", function() {
            $(this).closest(".plansGroupWrapper").toggleClass("folded");
        });

        $(".plansGroupWrapper").customSortable();
    } else {
        $(".plansGeneralWrapper").customSortable();
    }



    if (localStorage["plansOrder"]) { //if order local storage is defined, reorder plans in the storage order. new plans will be positioned on top
        var orderArray = JSON.parse(localStorage["plansOrder"]);
        for (var i = 0; i < orderArray.length; i++) {
            $plans.each(function () {
                if ($(this).attr("plan_id") == orderArray[i]) $(this).appendTo($(this).parent());
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
