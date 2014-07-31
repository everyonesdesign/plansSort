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

    $.fn.customSortable = function () { //sortable settings to sort plans
        $(this).sortable({
            items: "[plan_id]",
            axis: "y",
            tolerance: "pointer",
            handle: ".plan-moveHandle",
            stop: writeAllToStorage //on sortable complete renew data in storage
        });
    };

    $(".plansGeneralWrapper").before("<div class='plansGroupMode'>" +
        "<label><input id='plansSortToggle' type='checkbox'" + (groupPlans ? " checked" : "") + "> группировать по сайтам</label>" +
        "</div>");

    $("#plansSortToggle").change(function() {
        if (groupPlans) {
            localStorage["groupPlans"] = 0;
        } else {
            localStorage["groupPlans"] = 1;
        }
        window.location.reload();
    });


    if (groupPlans) {
        var groups = {},
            groupsOrder = localStorage["groupsOrder"] ? JSON.parse(localStorage["groupsOrder"]) : false;
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
            var isHidden = localStorage["foldedGroups"] && JSON.parse(localStorage["foldedGroups"]).indexOf(key) > -1;
            $wrapper = $("<div class='plansGroupWrapper" + (isHidden ? " folded" : "") + "' data-object-id='" + key + "'></div>");
            $("[plan_id][object_id='" + key + "']")
                .prependTo($(".plansGeneralWrapper"))
                .wrapAll($wrapper);
            $(".plansGroupWrapper[data-object-id='" + key + "']").prepend("<div class='plansGroupWrapper-info'>" +
                "<div class='plansGroupWrapper-handle'></div>" +
                "<span><a href='/staff/sites/?site_id=" + key + "'>Сайт #" + key + "</a></span>" +
                "<span class='domainName'><a href='http://" + value.domain + "'>" + value.domain + "</a></span>" +
                "<span>Количество планов: " + value.number + "</span>" +
                "<span class='plansGroupToggle'><a href='javascript:;'>Свернуть/развернуть</a></span>" +
                "</div>");
        });

        if (groupsOrder) {
            for (var i= 1; i<groupsOrder.length; i++) {
                $(".plansGroupWrapper[data-object-id='" + groupsOrder[i] + "']").appendTo(".plansGeneralWrapper");
            }
        }

        $(".plansGroupToggle").on("click", function() {
            $(this).closest(".plansGroupWrapper").toggleClass("folded");
            writeAllToStorage();
        });

        $(".plansGroupWrapper").customSortable();

        $(".plansGeneralWrapper").sortable({//sortable settings for groups sorting
            items: ".plansGroupWrapper",
            axis: "y",
            tolerance: "pointer",
            handle: ".plansGroupWrapper-handle",
            stop: writeAllToStorage //on sortable complete renew data in storage
        });

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
        writeFoldedGroups();
        writeGroupsOrder();
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
    function writeFoldedGroups() {
        if (!groupPlans) return;
        var foldedGroupsArray = [];
        $(".plansGroupWrapper.folded").each(function() {
            var id = $(this).attr("data-object-id");
            foldedGroupsArray.push(id);
        });
        localStorage["foldedGroups"] = JSON.stringify(foldedGroupsArray);
    }
    function writeGroupsOrder() {
        var orderArray = [];
        if (!groupPlans) return;
        $(".plansGroupWrapper").each(function () { //we have to reselect it to update the structure
            var id = $(this).attr("data-object-id");
            orderArray.push(id);
        });
        localStorage["groupsOrder"] = JSON.stringify(orderArray);
    }

})(jQuery);
