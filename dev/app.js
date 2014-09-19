var plansSort = {

    options: {
        hiddenOpacity: 0.4,
        defaultAllowedUrls: [
            "/staff/client/plan.my.php"
        ]
    },

    globals: {
      $plans: $("[plan_id]"),
      currentUrl: /(.*?)\/?$/.exec(window.location.pathname)[1]+window.location.search,
      currentLocation: " at "+ /(.*?)\/?$/.exec(window.location.pathname)[1]+window.location.search,
      escapeRegExp: function(string) {
        return string.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
      }
    },

    markup: {
        plansControls: "<div class='plan-icons'>" +
                        "<div class='plan-icon plan-changeOpacity'></div>" +
                        "<div class='plan-icon plan-moveHandle'></div>" +
                      "</div>",
        plansGeneralWrapper: "<div class='plansGeneralWrapper'></div>",
        plansTopPanelEnabled: "<div class='plansTopPanel'>" +
                                "<input class='plansSearch' type='text' placeholder='Поиск по планам'>" +
                                "<label><input class='plansGroupModeToggle' type='checkbox' %checked%> группировать по сайтам</label>" +
                                "<button class='btn plansSortToggle plansSortToggle--disable'>Отключить сортировку</button>" +
                              "</div>",
        plansTopPanelDisabled: "<div class='plansTopPanel'>" +
                                  "<input class='plansSearch' type='text' placeholder='Поиск по планам'>" +
                                  "<button class='btn btn-success plansSortToggle plansSortToggle--enable'>Включить сортировку</button>" +
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

        plansSort.globals.groupPlans = plansSort.read.groupsEnabled();

        plansSort.setAllowedUrls();

        if (plansSort.isUrlAllowed()) {

            //bootstrap
            plansSort.bootstrapAllowedUrl();

            //bindings
            plansSort.bindPlansControls();
            plansSort.bindGroupModeToggle();
            plansSort.bindSortToggle();
            plansSort.bindPlansSearch();

            if (plansSort.globals.groupPlans) {
                plansSort.initPlansGrouped();
            } else {
                plansSort.initPlansUngrouped();
            }

            plansSort.sortPlans();
            plansSort.setPlansOpacity();

        } else {

            plansSort.bootstrapUnallowedUrl();
            plansSort.bindSortToggle();
            plansSort.bindPlansSearch();

        }

    },

    bootstrapAllowedUrl: function() {
        var checked = plansSort.globals.groupPlans ? " checked" : "";

        plansSort.globals.$plans
            .append(plansSort.markup.plansControls)
            .wrapAll(plansSort.markup.plansGeneralWrapper);

        $(".plansGeneralWrapper").before(plansSort.markup.plansTopPanelEnabled.replace("%checked%", checked));
    },

    bootstrapUnallowedUrl: function() {
        //TODO: find a better way to paste the element
        $(".attach_call_container").after(plansSort.markup.plansTopPanelDisabled);
    },

    setAllowedUrls: function() {
      plansSort.globals.allowedUrls = plansSort.read.allowedUrls() || plansSort.options.defaultAllowedUrls;
    },

    isUrlAllowed: function() {
      return plansSort.globals.allowedUrls.indexOf(plansSort.globals.currentUrl) > -1;
    },

    bindPlansControls: function() {

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
        $(".plansGroupModeToggle").change(function() {
            if (plansSort.globals.groupPlans) {
                plansSort.write.groupsEnabled(0);
            } else {
                plansSort.write.groupsEnabled(1);
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

    bindSortToggle: function() {
        $(".plansSortToggle").on("click", function() {
            if ($(this).hasClass("plansSortToggle--enable")) {
                plansSort.write.allowedUrls(plansSort.globals.currentUrl, "add");
            } else {
                plansSort.write.allowedUrls(plansSort.globals.currentUrl, "delete");
            }
            window.location.reload();
        });
    },

    bindPlansSearch: function() {
        $(".plansSearch").on("input", function() {
                var $this = $(this),
                    $plans = $("[plan_id]"),
                    needle = $.trim($this.val());
                $(".plansSearch-mark").each(function() {
                   this.outerHTML = this.innerHTML;
                });
                if (needle) {
                    $(document.body).addClass("body--plansSearch");
                    $plans.each(function() {
                        var $plan = $(this),
                            matched = false,
                            $haystack = $plan.find(".plan_body")
                                             .add($plan.find(".plan_comments"))
                                             .add($plan.find(".site-domain"))
                                             .add($plan.find(".site-domain").prev());
                        $haystack.each(function() {
                           var text = $(this).text();
                           if (text.toLowerCase().indexOf(needle.toLowerCase()) > -1 ) {
                               $(this).highlightRegex(new RegExp(plansSort.globals.escapeRegExp(needle), "gi"), {
                                   tagType: 'mark',
                                   className: 'plansSearch-mark'
                               });
                               matched = true
                           }
                           $plan.toggleClass("matched", matched);
                        });
                    });
                } else {
                    $(document.body).removeClass("body--plansSearch");
                    $plans.removeClass("matched");
                }
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
        if (plansSort.read.plansOrder()) { //if order local storage is defined, reorder plans in the storage order. new plans will be positioned on top
            var orderArray = plansSort.read.plansOrder();
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
        if (plansSort.read.plansOpacity()) { //if opacity local storage is defined apply it
            var opacityArray = plansSort.read.plansOpacity();
            for (var i = 0; i < opacityArray.length; i++) {
                plansSort.globals.$plans.filter("[plan_id='" + opacityArray[i] + "']").css("opacity", plansSort.options.hiddenOpacity);
            }
        }
    },

    initPlansGrouped: function() {

        var groups = {},
            groupsOrder = plansSort.read.groupsOrder();

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
            var folded = plansSort.read.groupsFolded() && plansSort.read.groupsFolded().indexOf(key) > -1,
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


    /**** ALL THE METHODS OF ACTIONS WITH STORAGE ARE HERE ****/

    read: {
        plansOrder: function() {
            if (localStorage["plansOrder"+plansSort.globals.currentLocation]) {
                return JSON.parse(localStorage["plansOrder"+plansSort.globals.currentLocation]);
            } else {
                return false;
            }
        },
        plansOpacity: function() {
            if (localStorage["plansOpacity"+plansSort.globals.currentLocation]) {
                return JSON.parse(localStorage["plansOpacity"+plansSort.globals.currentLocation]);
            } else {
                return false;
            }
        },
        groupsEnabled: function() {
            return localStorage["groupPlans"+plansSort.globals.currentLocation] == 1;
        },
        groupsOrder: function() {
            if (localStorage["groupsOrder"+plansSort.globals.currentLocation]) {
                return JSON.parse(localStorage["groupsOrder"+plansSort.globals.currentLocation]);
            } else {
                return false;
            }
        },
        groupsFolded: function() {
            if (localStorage["foldedGroups"+plansSort.globals.currentLocation]) {
                return JSON.parse(localStorage["foldedGroups"+plansSort.globals.currentLocation]);
            } else {
                return false;
            }
        },
        allowedUrls: function() {
            if (localStorage["allowedUrls"]) {
                return JSON.parse(localStorage["allowedUrls"]);
            } else {
                return false;
            }
        }
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
            localStorage["plansOrder"+plansSort.globals.currentLocation] = JSON.stringify(orderArray);
        },
        plansOpacity: function() {
            var opacityArray = [];
            $("[plan_id]").each(function () {
                var id = $(this).attr("plan_id");
                if ($(this).css("opacity") != 1) {
                    opacityArray.push(id);
                }
            });
            localStorage["plansOpacity"+plansSort.globals.currentLocation] = JSON.stringify(opacityArray);
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
            localStorage["groupsOrder"+plansSort.globals.currentLocation] = JSON.stringify(orderArray);
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
            localStorage["foldedGroups"+plansSort.globals.currentLocation] = JSON.stringify(foldedGroupsArray);
        },
        groupsEnabled: function(value) {//this method isn't in write.all() 'cause it requires a value
            localStorage["groupPlans"+plansSort.globals.currentLocation] = value;
        },
        allowedUrls: function(element, action) {
            var allowedUrlsArray;
            if (action === "add") {
                plansSort.globals.allowedUrls.push(element);
                allowedUrlsArray = plansSort.globals.allowedUrls;
            } else if (action === "delete") {
                allowedUrlsArray = $.map(plansSort.globals.allowedUrls, function(value) {
                    if (value===element) {
                        return null; //this will delete the element
                    }
                    return value;
                });
            }
            localStorage["allowedUrls"] = JSON.stringify(allowedUrlsArray);
        }
    }

};

//compatibility with ver.2.0.0
if (localStorage["foldedGroups"]||
    localStorage["groupPlans"]||
    localStorage["groupsOrder"]||
    localStorage["plansOpacity"]||
    localStorage["plansOrder"]) {

    if (localStorage["foldedGroups"]) {
        localStorage["foldedGroups at /staff/client/plan.my.php"] = localStorage["foldedGroups"];
        localStorage.removeItem("foldedGroups");
    }
    if (localStorage["groupPlans"]) {
        localStorage["groupPlans at /staff/client/plan.my.php"] = localStorage["groupPlans"];
        localStorage.removeItem("groupPlans");
    }
    if (localStorage["groupsOrder"]) {
        localStorage["groupsOrder at /staff/client/plan.my.php"] = localStorage["groupsOrder"];
        localStorage.removeItem("groupsOrder");
    }
    if (localStorage["plansOpacity"]) {
        localStorage["plansOpacity at /staff/client/plan.my.php"] = localStorage["plansOpacity"];
        localStorage.removeItem("plansOpacity");
    }
    if (localStorage["plansOrder"]) {
        localStorage["plansOrder at /staff/client/plan.my.php"] = localStorage["plansOrder"];
        localStorage.removeItem("plansOrder");
    }

}

if ($("#content").length && plansSort.globals.$plans.length) { //if page not loaded or no plans on page then return;
    plansSort.init();
}

