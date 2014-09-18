var plansSort = {

    options: {
        hiddenOpacity: 0.4
    },

    globals: {
      $plans: $("[plan_id]"),
      groupPlans: localStorage["groupPlans"]==1||false
    },

    markup: {
        plansControls: "<div class='plan-icons'>" +
                        "<div class='plan-icon plan-changeOpacity'></div>" +
                        "<div class='plan-icon plan-moveHandle'></div>" +
                      "</div>",
        plansGeneralWrapper: "<div class='plansGeneralWrapper'></div>",
        groupModeToggle: "<div class='plansGroupMode'>" +
                            "<label><input id='plansSortToggle' type='checkbox'" + (plansSort.globals.groupPlans ? " checked" : "") + "> группировать по сайтам</label>" +
                         "</div>",
        plansGroupWrapper: "<div class='plansGroupWrapper %folded%' data-object-id='%key%'></div>",
        plansGroupWrapperInfo: "<div class='plansGroupWrapper-info'>" +
            "<div class='plansGroupWrapper-handle'></div>" +
            "<span><a href='/staff/sites/?site_id=%key%'>Сайт #%key%</a></span>" +
            "<span class='domainName'><a href='http://%domain%'>%domain%</a></span>" +
            "<span>Количество планов: %number%</span>" +
            "<span class='plansGroupToggle'><a href='javascript:;'>Свернуть/развернуть</a></span>" +
            "</div>"
    },

    init: function() {

        //bootstrap
        plansSort.bootstrap();

        //bindings
        plansSort.bindPlansControls();
        plansSort.bindGroupModeToggle();

        if (plansSort.globals.groupPlans) {
            plansSort.initPlansGrouped();
        } else {
            plansSort.initPlansUngrouped();
        }

        plansSort.sortPlans();
        plansSort.setPlansOpacity();

    },

    bootstrap: function() {
        plansSort.globals.$plans
            .append(plansSort.markup.plansControls)
            .wrapAll(plansSort.markup.plansGeneralWrapper);

        $(".plansGeneralWrapper").before(plansSort.markup.groupModeToggle);
    },

    bindPlansControls: function() {

        /********** OPACITY CONTROL **********/
        $(".plan-changeOpacity").on("click", function() {
            var $plan = $(this).closest("[plan_id]");
            if ($plan.css("opacity") == 1) {
                $plan.css("opacity", plansSort.options.hiddenOpacity);
            } else {
                $plan.css("opacity", 1);
            }
            plansSort.write.all();
        });

    },

    bindGroupModeToggle: function() {
        $("#plansSortToggle").change(function() {
            if (groupPlans) {
                localStorage["groupPlans"] = 0;
            } else {
                localStorage["groupPlans"] = 1;
            }
            window.location.reload();
        });
    },

    bindGroupToggle: function() {
        $(".plansGroupToggle").on("click", function() {
            $(this).closest(".plansGroupWrapper").toggleClass("folded");
            plansSort.write.all();
        });
    },


    makeSortable: function($obj) {
        $obj.sortable({
            items: "[plan_id]",
            axis: "y",
            tolerance: "pointer",
            handle: ".plan-moveHandle",
            stop: plansSort.write.all //on sortable complete renew data in storage
        });
    },

    sortPlans: function() {
        if (localStorage["plansOrder"]) { //if order local storage is defined, reorder plans in the storage order. new plans will be positioned on top
            var orderArray = JSON.parse(localStorage["plansOrder"]);
            for (var i = 0; i < orderArray.length; i++) {
                plansSort.globals.$plans.each(function () {
                    if ($(this).attr("plan_id") == orderArray[i]) {
                        $(this).appendTo($(this).parent());
                    }
                });
            }
        }
    },

    setPlansOpacity: function() {
        if (localStorage["plansOpacity"]) { //if opacity local storage is defined apply it
            var opacityArray = JSON.parse(localStorage["plansOpacity"]);
            for (var i = 0; i < opacityArray.length; i++) {
                plansSort.globals.$plans.filter("[plan_id='" + opacityArray[i] + "']").css("opacity", opacityToSet);
            }
        }
    },

    initPlansGrouped: function() {

        var groups = {},
            groupsOrder = localStorage["groupsOrder"] ? JSON.parse(localStorage["groupsOrder"]) : false;

        /*define groups and count elements in it*/
        plansSort.globals.$plans.each(function() {
            var thisGroup = $(this).attr("object_id");
            if (!groups[thisGroup]) {
                groups[thisGroup] = {};
                groups[thisGroup].domain = $(this).find(".site-domain").text();
                groups[thisGroup].number = 1;
            } else {
                groups[thisGroup].number++;
            }
        });

        /*place in group markup*/
        $.each(groups, function(key, value) {
            var folded = localStorage["foldedGroups"] && JSON.parse(localStorage["foldedGroups"]).indexOf(key) > -1,
                foldedText = folded ? " folded" : "",
                $plans = $("[plan_id][object_id='" + key + "']"),
                $wrapper;
            $wrapper = $(plansSort.markup.plansGroupWrapper.replace("%folded%", foldedText).replace("%key%", key));
            $plans.prependTo($(".plansGeneralWrapper"));
            $plans.wrapAll($wrapper);
            $(".plansGroupWrapper[data-object-id='" + key + "']").prepend(
                plansSort.markup.plansGroupWrapperInfo
                    .replace(/%key%/g, key)
                    .replace(/%domain%/g, value.domain)
                    .replace(/%number%/g, value.number)
            );
        });

        /*sort groups order*/
        if (groupsOrder) {
            for (var i= 0; i<groupsOrder.length; i++) {
                $(".plansGroupWrapper[data-object-id='" + groupsOrder[i] + "']").appendTo(".plansGeneralWrapper");
            }
        }

        plansSort.bindGroupToggle();
        plansSort.makeSortable($(".plansGroupWrapper"));

        $(".plansGeneralWrapper").sortable({//sortable settings for groups sorting
            items: ".plansGroupWrapper",
            axis: "y",
            tolerance: "pointer",
            handle: ".plansGroupWrapper-handle",
            stop: plansSort.write.all //on sortable complete renew data in storage
        });

    },

    initPlansUngrouped: function() {
        plansSort.makeSortable($(".plansGeneralWrapper"));
    },

    write: {
        all: function() {
            plansSort.write.plansOrder();
            plansSort.write.plansOpacity();
            plansSort.write.groupsOrder();
            plansSort.write.groupsFolded();
        },
        plansOrder: function() {
            var orderArray = [];
            $("[plan_id]").each(function () { //we have to reselect it to update the structure
                var id = $(this).attr("plan_id");
                orderArray.push(id);
            });
            localStorage["plansOrder"] = JSON.stringify(orderArray);
        },
        plansOpacity: function() {
            var opacityArray = [];
            $plans.each(function () {
                var id = $(this).attr("plan_id");
                if ($(this).css("opacity") != 1) {
                    opacityArray.push(id);
                }
            });
            localStorage["plansOpacity"] = JSON.stringify(opacityArray);
        },
        groupsOrder: function() {
            var orderArray = [];
            if (!plansSort.globals.groupPlans) {
                return;
            }
            $(".plansGroupWrapper").each(function () { //we have to reselect it to update the structure
                var id = $(this).attr("data-object-id");
                orderArray.push(id);
            });
            localStorage["groupsOrder"] = JSON.stringify(orderArray);
        },
        groupsFolded: function() {
            if (!plansSort.globals.groupPlans) {
                return;
            }
            var foldedGroupsArray = [];
            $(".plansGroupWrapper.folded").each(function() {
                var id = $(this).attr("data-object-id");
                foldedGroupsArray.push(id);
            });
            localStorage["foldedGroups"] = JSON.stringify(foldedGroupsArray);
        }
    }


};

if ($("#content").length && $plans.length) { //if page not loaded or no plans on page then return;
    plansSort.init();
}

