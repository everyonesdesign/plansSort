var plansManager = {

    options: {
        hiddenOpacity: 0.4,
        defaultAllowedUrls: [
            "/staff/client/plan.my.php"
        ]
    },

    globals: {
        $plans: $("[plan_id]"),
        currentUrl: /(.*?)\/?$/.exec(window.location.pathname)[1] + window.location.search,
        currentLocation: " at " + window.location.href,
        escapeRegExp: function (string) {
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
            "%sync%" +
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
            "</div>",
        plansSyncMenu: "<div class='btn-group plansSync'>" +
            "<a class='btn dropdown-toggle' data-toggle='dropdown' href='#'>" +
            "Синхронизация&nbsp;" +
            "<span class='caret'></span>" +
            "</a>" +
            "<ul class='dropdown-menu'>" +
            "<li><a href='#' class='plansSync-save'>Сохранить порядок планов</a></li>" +
            "<li><a href='#' class='plansSync-load'>Загрузить порядок планов</a></li>" +
            "<li class='divider'></li>" +
            "<li><a href='#' class='plansSync-status'>Статус планов</a></li>" +
            "<li><a href='#' class='plansSync-about'>Что это?</a></li>" +
            "</ul>" +
            "</div>",
        modal: "<div class='modal hide fade' style='display: none' id='plansModal'>" +
            "<div class='modal-header'>" +
            "<button type='button' class='close' data-dismiss='modal' aria-hidden='true'>&times;</button>" +
            "<h3 class='modal-title'></h3>" +
            "</div>" +
            "<div class='modal-body'></div>" +
            "</div>",
        alert: "<div class='alert plansAlert%single% %className%'>"
                    + "%body%" +
                    "<button type='button' class='close' data-dismiss='alert'>×</button>" +
                "</div>"
    },

    init: function () {

        plansManager.read.groupsEnabled(function (obj) {

            plansManager.globals.groupPlans = obj;

            plansManager.setAllowedUrls(function () {

                if (plansManager.isUrlAllowed()) {

                    //bootstrap
                    plansManager.bootstrapAllowedUrl();

                    //bindings
                    plansManager.bindPlansControls();
                    plansManager.bindGroupModeToggle();

                    if (plansManager.globals.groupPlans) {
                        plansManager.initPlansGrouped();
                    } else {
                        plansManager.initPlansUngrouped();
                    }

                    plansManager.sortPlans();
                    plansManager.setPlansOpacity();

                } else {

                    plansManager.bootstrapUnallowedUrl();

                }

                plansManager.bindSortToggle();
                plansManager.bindPlansSearch();
                plansManager.bindPlansSync();
                plansManager.bootstrapModal();

            });


        });

    },

    bootstrapAllowedUrl: function () {
        var checked = plansManager.globals.groupPlans ? " checked" : "";

        plansManager.globals.$plans
            .append(plansManager.markup.plansControls)
            .wrapAll(plansManager.markup.plansGeneralWrapper);

        $(".plansGeneralWrapper").before(
            plansManager.markup.plansTopPanelEnabled.replace("%checked%", checked).replace("%sync%", plansManager.markup.plansSyncMenu)
        );
    },

    bootstrapUnallowedUrl: function () {
        //TODO: find a better way to paste the element
        $(".attach_call_container").after(plansManager.markup.plansTopPanelDisabled);
    },

    bootstrapModal: function () {
        $(document.body).append(plansManager.markup.modal);
    },

    setAllowedUrls: function (callback) {
        plansManager.read.allowedUrls(function (obj) {
            plansManager.globals.allowedUrls = obj || plansManager.options.defaultAllowedUrls;
            callback();
        });
    },

    isUrlAllowed: function () {
        return plansManager.globals.allowedUrls.indexOf(plansManager.globals.currentUrl) > -1;
    },

    bindPlansSync: function () {
        $(".plansSync-save").click(function () {
            plansManager.sync.push(function () {
                plansManager.pushMsg("Порядок планов сохранен", "alert-success");
            });
        });
        $(".plansSync-load").click(function () {
            plansManager.sync.pull(function () {
                plansManager.pushMsg("Порядок планов загружен, перезагрузка страницы...", "alert-success");
                setTimeout(function() {
                    window.location.reload();
                }, 2000);
            });
        });

        $(".plansSync-status").click(function () {
            var title = "Статус синхронизации сортировки",
                body = "<p>Дата последнего локального изменения: %local%</p>" +
                    "<p>Дата последнего удаленного изменения: %synced%</p>";
            chrome.storage.sync.get("plansOrderTimestamp", function (syncedTimestamp) {
                plansManager.read.timestamp(function (localTimestamp) {
                    var localDate = localTimestamp ? new Date(localTimestamp).toLocaleString() : "Отсутствует",
                        syncedDate = syncedTimestamp["plansOrderTimestamp"] ? new Date(syncedTimestamp["plansOrderTimestamp"]).toLocaleString() : "Отсутствует";
                    body = body.replace("%local%", localDate).replace("%synced%", syncedDate);
                    plansManager.showModal(title, body);
                });
            });
        });

        $(".plansSync-about").click(function () {
            var title = "О синхронизации планов",
                body = "<p>Данное меню позволяет сохранять/загружать состояние сортировки планов для аккаунта Google.</p>" +
                    "<p><b>Сохранить порядок планов</b> - сохранить локальное расположение планов в хранилище аккаунта Google.</p>" +
                    "<p><b>Загрузить порядок планов</b> - загрузить локальное расположение планов из хранилища аккаунта Google.</p>" +
                    "<p><b>Статус планов</b> - посмотреть даты последнего изменения локального/удаленного расположения планов.</p>";
            plansManager.showModal(title, body);
        });

    },

    bindPlansControls: function () {

        $(".plan-changeOpacity").on("click", function () {
            var $plan = $(this).closest("[plan_id]");
            if ($plan.css("opacity") == 1) {
                $plan.css("opacity", plansManager.options.hiddenOpacity);
            } else {
                $plan.css("opacity", 1);
            }
            plansManager.write.all();
        });

    },

    bindGroupModeToggle: function () {
        $(".plansGroupModeToggle").change(function () {
            if (plansManager.globals.groupPlans) {
                plansManager.write.groupsEnabled(0);
            } else {
                plansManager.write.groupsEnabled(1);
            }
            window.location.reload();
        });
    },

    bindGroupToggle: function () {
        $(".plansGroupToggle").on("click", function () {
            $(this).closest(".plansGroupWrapper").toggleClass("folded");
            plansManager.write.all();
        });
    },

    bindSortToggle: function () {
        $(".plansSortToggle").on("click", function () {
            if ($(this).hasClass("plansSortToggle--enable")) {
                plansManager.write.allowedUrls(plansManager.globals.currentUrl, "add");
            } else {
                plansManager.write.allowedUrls(plansManager.globals.currentUrl, "delete");
            }
            window.location.reload();
        });
    },

    bindPlansSearch: function () {
        $(".plansSearch").on("input", function () {
            var $this = $(this),
                $plans = $("[plan_id]"),
                needle = $.trim($this.val());
            $(".plansSearch-mark").each(function () {
                this.outerHTML = this.innerHTML;
            });
            if (needle) {
                $(document.body).addClass("body--plansSearch");
                $plans.each(function () {
                    var $plan = $(this),
                        matched = false,
                        $haystack = $plan.find(".plan_body")
                            .add($plan.find(".plan_comments"))
                            .add($plan.find(".site-domain"))
                            .add($plan.find(".site-domain").prev());
                    $haystack.each(function () {
                        var text = $(this).text();
                        if (text.toLowerCase().indexOf(needle.toLowerCase()) > -1) {
                            $(this).highlightRegex(new RegExp(plansManager.globals.escapeRegExp(needle), "gi"), {
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

    showModal: function (title, body) {
        var $modal = $('#plansModal');
        $modal.find(".modal-title").text(title);
        $modal.find(".modal-body").html(body);
        $modal.modal();
    },

    pushMsg: function (body, className, single) {
        var alertHTML = plansManager.markup.alert
            .replace("%single%", single||"")
            .replace("%className%", className)
            .replace("%body%", body);
        var $alert = $(alertHTML);
        if (!(single && !$(".plansAlert" + single).length)) {
            $(".plansTopPanel").prepend($alert);
        }
    },

    makeSortable: function ($obj) {
        $obj.sortable({
            items: "[plan_id]",
            axis: "y",
            tolerance: "pointer",
            handle: ".plan-moveHandle",
            stop: plansManager.write.all //on sortable complete renew data in storage
        });
    },

    sortPlans: function () {
        plansManager.read.plansOrder(function (orderArray) {
            if (!orderArray) return;
            for (var i = 0; i < orderArray.length; i++) {
                plansManager.globals.$plans.each(function () {
                    if ($(this).attr("plan_id") == orderArray[i]) {
                        $(this).appendTo($(this).parent());
                    }
                });
            }
        });
    },

    setPlansOpacity: function () {
        plansManager.read.plansOpacity(function (opacityArray) {
            if (!opacityArray) return;
            for (var i = 0; i < opacityArray.length; i++) {
                plansManager.globals.$plans.filter("[plan_id='" + opacityArray[i] + "']").css("opacity", plansManager.options.hiddenOpacity);
            }
        });

    },

    initPlansGrouped: function () {

        var groups = {};

        plansManager.read.groupsOrder(function (groupsOrder) {

            plansManager.read.groupsFolded(function (groupsFolded) {

                /*define groups and count elements in it*/
                plansManager.globals.$plans.each(function () {
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
                $.each(groups, function (key, value) {
                    var folded = groupsFolded && groupsFolded.indexOf(key) > -1,
                        foldedText = folded ? " folded" : "",
                        $plans = $("[plan_id][object_id='" + key + "']"),
                        $wrapper;
                    $wrapper = $(plansManager.markup.plansGroupWrapper.replace("%folded%", foldedText).replace("%key%", key));
                    $plans.prependTo($(".plansGeneralWrapper"));
                    $plans.wrapAll($wrapper);
                    $(".plansGroupWrapper[data-object-id='" + key + "']").prepend(
                        plansManager.markup.plansGroupWrapperInfo
                            .replace(/%key%/g, key)
                            .replace(/%domain%/g, value.domain)
                            .replace(/%number%/g, value.number)
                    );
                });

                /*sort groups order*/
                if (groupsOrder) {
                    for (var i = 0; i < groupsOrder.length; i++) {
                        $(".plansGroupWrapper[data-object-id='" + groupsOrder[i] + "']").appendTo(".plansGeneralWrapper");
                    }
                }

                plansManager.bindGroupToggle();
                plansManager.makeSortable($(".plansGroupWrapper"));

                $(".plansGeneralWrapper").sortable({//sortable settings for groups sorting
                    items: ".plansGroupWrapper",
                    axis: "y",
                    tolerance: "pointer",
                    handle: ".plansGroupWrapper-handle",
                    stop: plansManager.write.all //on sortable complete renew data in storage
                });

            });

        });

    },

    initPlansUngrouped: function () {
        plansManager.makeSortable($(".plansGeneralWrapper"));
    },


    /**** ALL THE METHODS OF ACTIONS WITH STORAGE ARE HERE ****/

    read: {
        plansOrder: function (callback) {
            chrome.storage.local.get("plansOrder" + plansManager.globals.currentLocation, function (object) {
                callback(object["plansOrder" + plansManager.globals.currentLocation] ? JSON.parse(object["plansOrder" + plansManager.globals.currentLocation]) : false);
            });
        },
        timestamp: function (callback) {
            chrome.storage.local.get("plansOrderTimestamp", function (object) {
                callback(+(object["plansOrderTimestamp"]) || false);
            });
        },
        plansOpacity: function (callback) {
            chrome.storage.local.get(["plansOpacity" + plansManager.globals.currentLocation], function (object) {
                callback(object["plansOpacity" + plansManager.globals.currentLocation] ? JSON.parse(object["plansOpacity" + plansManager.globals.currentLocation]) : false);
            });
        },
        groupsEnabled: function (callback) {
            chrome.storage.local.get("groupPlans" + plansManager.globals.currentLocation, function (object) {
                callback(!!object["groupPlans" + plansManager.globals.currentLocation]);
            });
        },
        groupsOrder: function (callback) {
            chrome.storage.local.get("groupsOrder" + plansManager.globals.currentLocation, function (object) {
                callback(object["groupsOrder" + plansManager.globals.currentLocation] ? JSON.parse(object["groupsOrder" + plansManager.globals.currentLocation]) : false);
            });
        },
        groupsFolded: function (callback) {
            chrome.storage.local.get("foldedGroups" + plansManager.globals.currentLocation, function (object) {
                callback(object["foldedGroups" + plansManager.globals.currentLocation] ? JSON.parse(object["foldedGroups" + plansManager.globals.currentLocation]) : []);
            });
        },
        allowedUrls: function (callback) {
            chrome.storage.local.get("allowedUrls", function (object) {
                callback(object["allowedUrls"] ? JSON.parse(object["allowedUrls"]) : false);
            });
        }
    },

    write: {
        all: function () {
            plansManager.write.plansOrder();
            plansManager.write.plansOpacity();
            plansManager.write.groupsOrder();
            plansManager.write.groupsFolded();
        },
        timestamp: function () {
            chrome.storage.local.set({
                plansOrderTimestamp: +(new Date())
            });
        },
        plansOrder: function () {
            var orderArray = [],
                objToSet = {};
            $("[plan_id]").each(function () { //we have to reselect it to update the structure
                var id = $(this).attr("plan_id");
                orderArray.push(id);
            });
            objToSet["plansOrder" + plansManager.globals.currentLocation] = JSON.stringify(orderArray);
            chrome.storage.local.set(objToSet);
            plansManager.write.timestamp();
        },
        plansOpacity: function () {
            var opacityArray = [],
                objToSet = {};
            $("[plan_id]").each(function () {
                var id = $(this).attr("plan_id");
                if ($(this).css("opacity") != 1) {
                    opacityArray.push(id);
                }
            });
            objToSet["plansOpacity" + plansManager.globals.currentLocation] = JSON.stringify(opacityArray);
            chrome.storage.local.set(objToSet);
            plansManager.write.timestamp();
        },
        groupsOrder: function () {
            var orderArray = [],
                objToSet = {};
            if (!plansManager.globals.groupPlans) {
                return;
            }
            $(".plansGroupWrapper").each(function () { //we have to reselect it to update the structure
                var id = $(this).attr("data-object-id");
                orderArray.push(id);
            });
            objToSet["groupsOrder" + plansManager.globals.currentLocation] = JSON.stringify(orderArray);
            chrome.storage.local.set(objToSet);
            plansManager.write.timestamp();
        },
        groupsFolded: function () {
            var foldedGroupsArray = [],
                objToSet = {};
            if (!plansManager.globals.groupPlans) {
                return;
            }
            $(".plansGroupWrapper.folded").each(function () {
                var id = $(this).attr("data-object-id");
                foldedGroupsArray.push(id);
            });
            objToSet["foldedGroups" + plansManager.globals.currentLocation] = JSON.stringify(foldedGroupsArray);
            chrome.storage.local.set(objToSet);
            plansManager.write.timestamp();
        },
        groupsEnabled: function (value) {//this method isn't in write.all() 'cause it requires a value
            var objToSet = {};
            objToSet["groupPlans" + plansManager.globals.currentLocation] = value;
            chrome.storage.local.set(objToSet);
            plansManager.write.timestamp();
        },
        allowedUrls: function (element, action) {
            var allowedUrlsArray;
            if (action === "add") {
                plansManager.globals.allowedUrls.push(element);
                allowedUrlsArray = plansManager.globals.allowedUrls;
            } else if (action === "delete") {
                allowedUrlsArray = $.map(plansManager.globals.allowedUrls, function (value) {
                    if (value === element) {
                        return null; //this will delete the element
                    }
                    return value;
                });
            }
            chrome.storage.local.set({allowedUrls: JSON.stringify(allowedUrlsArray)});
            plansManager.write.timestamp();
        }
    },

    sync: {
        pull: function (callback) {
            callback = callback || function () {
            };
            chrome.storage.local.clear();
            chrome.storage.sync.get(null, function (items) {
                chrome.storage.local.set(items, function () {
                    plansManager.write.timestamp(); //set local timestamp after sync
                    callback();
                });
            });
        },
        push: function (callback) {
            callback = callback || function () {
            };
            chrome.storage.sync.clear();
            plansManager.write.timestamp();
            chrome.storage.local.get(null, function (items) {
                chrome.storage.sync.set(items, callback);
            });
        }
    }

};

if ($("#content").length && plansManager.globals.$plans.length) { //if page not loaded or no plans on page then return
    plansManager.init();
}

