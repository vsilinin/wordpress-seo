(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

/* global ajaxurl */
/* global wpseoAdminGlobalL10n, wpseoConsoleNotifications */
/* jshint -W097 */
/* jshint unused:false */

(function ($) {
	/**
  * Displays console notifications.
  *
  * Looks at a global variable to display all notifications in there.
  *
  * @returns {void}
  */
	function displayConsoleNotifications() {
		if (typeof window.wpseoConsoleNotifications === "undefined" || typeof console === "undefined") {
			return;
		}

		/* jshint ignore:start */
		for (var index = 0; index < wpseoConsoleNotifications.length; index++) {
			console.warn(wpseoConsoleNotifications[index]);
		}
		/* jshint ignore:end */
	}

	jQuery(document).ready(displayConsoleNotifications);

	/**
  * Used to dismiss the tagline notice for a specific user.
  *
  * @param {string} nonce
  *
  * @returns {void}
  */
	function wpseoDismissTaglineNotice(nonce) {
		jQuery.post(ajaxurl, {
			action: "wpseo_dismiss_tagline_notice",
			_wpnonce: nonce
		});
	}

	/**
  * Used to remove the admin notices for several purposes, dies on exit.
  *
  * @param {string} option
  * @param {string} hide
  * @param {string} nonce
  *
  * @returns {void}
  */
	function wpseoSetIgnore(option, hide, nonce) {
		jQuery.post(ajaxurl, {
			action: "wpseo_set_ignore",
			option: option,
			_wpnonce: nonce
		}, function (data) {
			if (data) {
				jQuery("#" + hide).hide();
				jQuery("#hidden_ignore_" + option).val("ignore");
			}
		});
	}

	/**
  * Generates a dismissable anchor button.
  *
  * @param {string} dismiss_link The URL that leads to the dismissing of the notice.
  *
  * @returns {Object} Anchor to dismiss.
  */
	function wpseoDismissLink(dismiss_link) {
		return jQuery('<a href="' + dismiss_link + '" type="button" class="notice-dismiss">' + '<span class="screen-reader-text">Dismiss this notice.</span>' + "</a>");
	}

	jQuery(document).ready(function () {
		jQuery(".yoast-dismissible").on("click", ".yoast-notice-dismiss", function () {
			var $parentDiv = jQuery(this).parent();

			// Deprecated, todo: remove when all notifiers have been implemented.
			jQuery.post(ajaxurl, {
				action: $parentDiv.attr("id").replace(/-/g, "_"),
				_wpnonce: $parentDiv.data("nonce"),
				data: $parentDiv.data("json")
			});

			jQuery.post(ajaxurl, {
				action: "yoast_dismiss_notification",
				notification: $parentDiv.attr("id"),
				nonce: $parentDiv.data("nonce"),
				data: $parentDiv.data("json")
			});

			$parentDiv.fadeTo(100, 0, function () {
				$parentDiv.slideUp(100, function () {
					$parentDiv.remove();
				});
			});

			return false;
		});

		jQuery(".yoast-help-button").on("click", function () {
			var $button = jQuery(this),
			    helpPanel = jQuery("#" + $button.attr("aria-controls")),
			    isPanelVisible = helpPanel.is(":visible");

			jQuery(helpPanel).slideToggle(200, function () {
				$button.attr("aria-expanded", !isPanelVisible);
			});
		});
	});
	window.wpseoDismissTaglineNotice = wpseoDismissTaglineNotice;
	window.wpseoSetIgnore = wpseoSetIgnore;
	window.wpseoDismissLink = wpseoDismissLink;

	/**
  * Hides popup showing new alerts message.
  *
  * @returns {void}
  */
	function hideAlertPopup() {
		// Remove the namespaced hover event from the menu top level list items.
		$("#wp-admin-bar-root-default > li").off("hover.yoastalertpopup");
		// Hide the notification popup by fading it out.
		$(".yoast-issue-added").fadeOut(200);
	}

	/**
  * Shows popup with new alerts message.
  *
  * @returns {void}
  */
	function showAlertPopup() {
		// Attach an hover event and show the notification popup by fading it in.
		$(".yoast-issue-added").on("hover", function (evt) {
			// Avoid the hover event to propagate on the parent elements.
			evt.stopPropagation();
			// Hide the notification popup when hovering on it.
			hideAlertPopup();
		}).fadeIn();

		/*
   * Attach a namespaced hover event on the menu top level items to hide
   * the notification popup when hovering them.
   * Note: this will work just the first time the list items get hovered in the
   * first 3 seconds after DOM ready because this event is then removed.
   */
		$("#wp-admin-bar-root-default > li").on("hover.yoastalertpopup", hideAlertPopup);

		// Hide the notification popup after 3 seconds from DOM ready.
		setTimeout(hideAlertPopup, 3000);
	}

	/**
  * Handles dismiss and restore AJAX responses.
  *
  * @param {Object} $source Object that triggered the request.
  * @param {Object} response AJAX response.
  *
  * @returns {void}
  */
	function handleDismissRestoreResponse($source, response) {
		$(".yoast-alert-holder").off("click", ".restore").off("click", ".dismiss");

		if (typeof response.html === "undefined") {
			return;
		}

		if (response.html) {
			$source.closest(".yoast-container").html(response.html);
			/* jshint ignore:start */
			/* eslint-disable */
			hookDismissRestoreButtons();
			/* jshint ignore:end */
			/* eslint-enable */
		}

		var $wpseo_menu = $("#wp-admin-bar-wpseo-menu");
		var $issue_counter = $wpseo_menu.find(".yoast-issue-counter");

		if (!$issue_counter.length) {
			$wpseo_menu.find("> a:first-child").append('<div class="yoast-issue-counter"/>');
			$issue_counter = $wpseo_menu.find(".yoast-issue-counter");
		}

		$issue_counter.html(response.total);
		if (response.total === 0) {
			$issue_counter.hide();
		} else {
			$issue_counter.show();
		}

		$("#toplevel_page_wpseo_dashboard .update-plugins").removeClass().addClass("update-plugins count-" + response.total);
		$("#toplevel_page_wpseo_dashboard .plugin-count").html(response.total);
	}

	/**
  * Hooks the restore and dismiss buttons.
  *
  * @returns {void}
  */
	function hookDismissRestoreButtons() {
		var $dismissible = $(".yoast-alert-holder");

		$dismissible.on("click", ".dismiss", function () {
			var $this = $(this);
			var $source = $this.closest(".yoast-alert-holder");

			var $container = $this.closest(".yoast-container");
			$container.append('<div class="yoast-container-disabled"/>');

			$this.find("span").removeClass("dashicons-no-alt").addClass("dashicons-randomize");

			$.post(ajaxurl, {
				action: "yoast_dismiss_alert",
				notification: $source.attr("id"),
				nonce: $source.data("nonce"),
				data: $source.data("json")
			}, handleDismissRestoreResponse.bind(this, $source), "json");
		});

		$dismissible.on("click", ".restore", function () {
			var $this = $(this);
			var $source = $this.closest(".yoast-alert-holder");

			var $container = $this.closest(".yoast-container");
			$container.append('<div class="yoast-container-disabled"/>');

			$this.find("span").removeClass("dashicons-arrow-up").addClass("dashicons-randomize");

			$.post(ajaxurl, {
				action: "yoast_restore_alert",
				notification: $source.attr("id"),
				nonce: $source.data("nonce"),
				data: $source.data("json")
			}, handleDismissRestoreResponse.bind(this, $source), "json");
		});
	}

	/**
  * Sets the color of the svg for the premium indicator based on the color of the color scheme.
  *
  * @returns {void}
  */
	function setPremiumIndicatorColor() {
		var $premiumIndicator = jQuery(".wpseo-js-premium-indicator");
		var $svg = $premiumIndicator.find("svg");

		// Don't change the color to stand out when premium is actually enabled.
		if ($premiumIndicator.hasClass("wpseo-premium-indicator--no")) {
			var $svgPath = $svg.find("path");

			var backgroundColor = $premiumIndicator.css("backgroundColor");

			$svgPath.css("fill", backgroundColor);
		}

		$svg.css("display", "block");
		$premiumIndicator.css({
			backgroundColor: "transparent",
			width: "20px",
			height: "20px"
		});
	}

	/**
  * Checks a scrollable table width.
  *
  * Compares the scrollable table width against the size of its container and
  * adds or removes CSS classes accordingly.
  *
  * @param {object} table A jQuery object with one scrollable table.
  * @returns {void}
  */
	function checkScrollableTableSize(table) {
		// Bail if the table is hidden.
		if (table.is(":hidden")) {
			return;
		}

		// When the table is wider than its parent, make it scrollable.
		if (table.outerWidth() > table.parent().outerWidth()) {
			table.data("scrollHint").addClass("yoast-has-scroll");
			table.data("scrollContainer").addClass("yoast-has-scroll");
		} else {
			table.data("scrollHint").removeClass("yoast-has-scroll");
			table.data("scrollContainer").removeClass("yoast-has-scroll");
		}
	}

	/**
  * Checks the width of multiple scrollable tables.
  *
  * @param {object} tables A jQuery collection of scrollable tables.
  * @returns {void}
  */
	function checkMultipleScrollableTablesSize(tables) {
		tables.each(function () {
			checkScrollableTableSize($(this));
		});
	}

	/**
  * Makes tables scrollable.
  *
  * Usage: see related stylesheet.
  *
  * @returns {void}
  */
	function createScrollableTables() {
		// Get the tables elected to be scrollable and store them for later reuse.
		window.wpseoScrollableTables = $(".yoast-table-scrollable");

		// Bail if there are no tables.
		if (!window.wpseoScrollableTables.length) {
			return;
		}

		// Loop over the collection of tables and build some HTML around them.
		window.wpseoScrollableTables.each(function () {
			var table = $(this);

			/*
    * Create an element with a hint message and insert it in the DOM
    * before each table.
    */
			var scrollHint = $("<div />", {
				"class": "yoast-table-scrollable__hintwrapper",
				html: "<span class='yoast-table-scrollable__hint' aria-hidden='true' />"
			}).insertBefore(table);

			/*
    * Create a wrapper element with an inner div necessary for
    * styling and insert them in the DOM before each table.
    */
			var scrollContainer = $("<div />", {
				"class": "yoast-table-scrollable__container",
				html: "<div class='yoast-table-scrollable__inner' />"
			}).insertBefore(table);

			// Set the hint message text.
			scrollHint.find(".yoast-table-scrollable__hint").text(wpseoAdminGlobalL10n.scrollable_table_hint);

			// For each table, store a reference to its wrapper element.
			table.data("scrollContainer", scrollContainer);

			// For each table, store a reference to its hint message.
			table.data("scrollHint", scrollHint);

			// Move the scrollable table inside the wrapper.
			table.appendTo(scrollContainer.find(".yoast-table-scrollable__inner"));

			// Check each table's width.
			checkScrollableTableSize(table);
		});
	}

	/*
  * When the viewport size changes, check again the scrollable tables width.
  * About the events: technically `wp-window-resized` is triggered on the
  * body but since it bubbles, it happens also on the window.
  * Also, instead of trying to detect events support on devices and browsers,
  * we just run the check on both `wp-window-resized` and `orientationchange`.
  */
	$(window).on("wp-window-resized orientationchange", function () {
		// Bail if there are no tables.
		if (!window.wpseoScrollableTables.length) {
			return;
		}

		checkMultipleScrollableTablesSize(window.wpseoScrollableTables);
	});

	$(document).ready(function () {
		showAlertPopup();
		hookDismissRestoreButtons();
		setPremiumIndicatorColor();
		createScrollableTables();
	});

	/**
  * Starts video if found on the tab.
  *
  * @param {object} $tab Tab that is activated.
  *
  * @returns {void}
  */
	function activateVideo($tab) {
		var $data = $tab.find(".wpseo-tab-video__data");
		if ($data.length === 0) {
			return;
		}

		$data.append('<iframe width="560" height="315" src="' + $data.data("url") + '" title="' + wpseoAdminGlobalL10n.help_video_iframe_title + '" frameborder="0" allowfullscreen></iframe>');
	}

	/**
  * Stops playing any video.
  *
  * @returns {void}
  */
	function stopVideos() {
		$("#wpbody-content").find(".wpseo-tab-video__data").children().remove();
	}

	/**
  * Opens a tab.
  *
  * @param {object} $container Container that contains the tab.
  * @param {object} $tab Tab that is activated.
  *
  * @returns {void}
  */
	function openHelpCenterTab($container, $tab) {
		$container.find(".yoast-help-center-tabs-wrap div").removeClass("active");
		$tab.addClass("active");

		stopVideos();
		activateVideo($tab);
		checkMultipleScrollableTablesSize($tab.find(".yoast-table-scrollable"));
	}

	/**
  * Opens the Video Slideout.
  *
  * @param {object} $container Tab to open video slider of.
  *
  * @returns {void}
  */
	function openVideoSlideout($container) {
		$container.find(".toggle__arrow").removeClass("dashicons-arrow-down").addClass("dashicons-arrow-up");
		$container.find(".wpseo-tab-video-container__handle").attr("aria-expanded", "true");
		$container.find(".wpseo-tab-video-slideout").removeClass("hidden");

		var $activeTabLink = $container.find(".wpseo-help-center-item.active > a");

		$("#wpcontent").addClass("yoast-help-center-open");

		if ($activeTabLink.length > 0) {
			var activeTabId = $activeTabLink.attr("aria-controls"),
			    activeTab = $("#" + activeTabId);

			activateVideo(activeTab);

			checkMultipleScrollableTablesSize(activeTab.find(".yoast-table-scrollable"));

			$container.on("click", ".wpseo-help-center-item > a", function (e) {
				var $link = $(this);
				var target = $link.attr("aria-controls");

				$container.find(".wpseo-help-center-item").removeClass("active");
				$link.parent().addClass("active");

				openHelpCenterTab($container, $("#" + target));

				e.preventDefault();
			});
		} else {
			// Todo: consider if scrollable tables need to be checked here too.
			activateVideo($container);
		}

		$("#sidebar-container").hide();
	}

	/**
  * Closes the Video Slideout.
  *
  * @returns {void}
  */
	function closeVideoSlideout() {
		var $container = $("#wpbody-content").find(".wpseo-tab-video-container");
		$container.find(".wpseo-tab-video-slideout").addClass("hidden");

		stopVideos();

		$container.find(".toggle__arrow").removeClass("dashicons-arrow-up").addClass("dashicons-arrow-down");
		$container.find(".wpseo-tab-video-container__handle").attr("aria-expanded", "false");

		$("#wpcontent").removeClass("yoast-help-center-open");
		$("#sidebar-container").show();
	}

	$(".nav-tab").click(function () {
		closeVideoSlideout();
	});

	$(".wpseo-tab-video-container").on("click", ".wpseo-tab-video-container__handle", function (e) {
		var $container = $(e.delegateTarget);
		var $slideout = $container.find(".wpseo-tab-video-slideout");
		if ($slideout.hasClass("hidden")) {
			openVideoSlideout($container);
		} else {
			closeVideoSlideout();
		}
	});

	// Set the yoast-tooltips on the list table links columns.
	$(".yoast-column-header-has-tooltip").each(function () {
		var parentLink = $(this).closest("a");

		parentLink.addClass("yoast-tooltip yoast-tooltip-n yoast-tooltip-multiline").attr("aria-label", $(this).data("label"));
	});
})(jQuery);

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJqcy9zcmMvd3Atc2VvLWFkbWluLWdsb2JhbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUUsV0FBVSxDQUFWLEVBQWM7QUFDZjs7Ozs7OztBQU9BLFVBQVMsMkJBQVQsR0FBdUM7QUFDdEMsTUFBSyxPQUFPLE9BQU8seUJBQWQsS0FBNEMsV0FBNUMsSUFBMkQsT0FBTyxPQUFQLEtBQW1CLFdBQW5GLEVBQWlHO0FBQ2hHO0FBQ0E7O0FBRUQ7QUFDQSxPQUFNLElBQUksUUFBUSxDQUFsQixFQUFxQixRQUFRLDBCQUEwQixNQUF2RCxFQUErRCxPQUEvRCxFQUF5RTtBQUN4RSxXQUFRLElBQVIsQ0FBYywwQkFBMkIsS0FBM0IsQ0FBZDtBQUNBO0FBQ0Q7QUFDQTs7QUFFRCxRQUFRLFFBQVIsRUFBbUIsS0FBbkIsQ0FBMEIsMkJBQTFCOztBQUVBOzs7Ozs7O0FBT0EsVUFBUyx5QkFBVCxDQUFvQyxLQUFwQyxFQUE0QztBQUMzQyxTQUFPLElBQVAsQ0FBYSxPQUFiLEVBQXNCO0FBQ3JCLFdBQVEsOEJBRGE7QUFFckIsYUFBVTtBQUZXLEdBQXRCO0FBS0E7O0FBRUQ7Ozs7Ozs7OztBQVNBLFVBQVMsY0FBVCxDQUF5QixNQUF6QixFQUFpQyxJQUFqQyxFQUF1QyxLQUF2QyxFQUErQztBQUM5QyxTQUFPLElBQVAsQ0FBYSxPQUFiLEVBQXNCO0FBQ3JCLFdBQVEsa0JBRGE7QUFFckIsV0FBUSxNQUZhO0FBR3JCLGFBQVU7QUFIVyxHQUF0QixFQUlHLFVBQVUsSUFBVixFQUFpQjtBQUNuQixPQUFLLElBQUwsRUFBWTtBQUNYLFdBQVEsTUFBTSxJQUFkLEVBQXFCLElBQXJCO0FBQ0EsV0FBUSxvQkFBb0IsTUFBNUIsRUFBcUMsR0FBckMsQ0FBMEMsUUFBMUM7QUFDQTtBQUNELEdBVEQ7QUFXQTs7QUFFRDs7Ozs7OztBQU9BLFVBQVMsZ0JB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LFFBQVYsQ0FBb0IsUUFBcEIsQ0FBTCxFQUFzQztBQUNyQyxxQkFBbUIsVUFBbkI7QUFDQSxHQUZELE1BRU87QUFDTjtBQUNBO0FBQ0QsRUFSRDs7QUFVQTtBQUNBLEdBQUcsa0NBQUgsRUFBd0MsSUFBeEMsQ0FBOEMsWUFBVztBQUN4RCxNQUFJLGFBQWEsRUFBRyxJQUFILEVBQVUsT0FBVixDQUFtQixHQUFuQixDQUFqQjs7QUFFQSxhQUNFLFFBREYsQ0FDWSx1REFEWixFQUVFLElBRkYsQ0FFUSxZQUZSLEVBRXNCLEVBQUcsSUFBSCxFQUFVLElBQVYsQ0FBZ0IsT0FBaEIsQ0FGdEI7QUFHQSxFQU5EO0FBUUEsQ0E3Z0JDLEVBNmdCQyxNQTdnQkQsQ0FBRiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKiBnbG9iYWwgYWpheHVybCAqL1xuLyogZ2xvYmFsIHdwc2VvQWRtaW5HbG9iYWxMMTBuLCB3cHNlb0NvbnNvbGVOb3RpZmljYXRpb25zICovXG4vKiBqc2hpbnQgLVcwOTcgKi9cbi8qIGpzaGludCB1bnVzZWQ6ZmFsc2UgKi9cblxuKCBmdW5jdGlvbiggJCApIHtcblx0LyoqXG5cdCAqIERpc3BsYXlzIGNvbnNvbGUgbm90aWZpY2F0aW9ucy5cblx0ICpcblx0ICogTG9va3MgYXQgYSBnbG9iYWwgdmFyaWFibGUgdG8gZGlzcGxheSBhbGwgbm90aWZpY2F0aW9ucyBpbiB0aGVyZS5cblx0ICpcblx0ICogQHJldHVybnMge3ZvaWR9XG5cdCAqL1xuXHRmdW5jdGlvbiBkaXNwbGF5Q29uc29sZU5vdGlmaWNhdGlvbnMoKSB7XG5cdFx0aWYgKCB0eXBlb2Ygd2luZG93Lndwc2VvQ29uc29sZU5vdGlmaWNhdGlvbnMgPT09IFwidW5kZWZpbmVkXCIgfHwgdHlwZW9mIGNvbnNvbGUgPT09IFwidW5kZWZpbmVkXCIgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0LyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xuXHRcdGZvciAoIHZhciBpbmRleCA9IDA7IGluZGV4IDwgd3BzZW9Db25zb2xlTm90aWZpY2F0aW9ucy5sZW5ndGg7IGluZGV4KysgKSB7XG5cdFx0XHRjb25zb2xlLndhcm4oIHdwc2VvQ29uc29sZU5vdGlmaWNhdGlvbnNbIGluZGV4IF0gKTtcblx0XHR9XG5cdFx0LyoganNoaW50IGlnbm9yZTplbmQgKi9cblx0fVxuXG5cdGpRdWVyeSggZG9jdW1lbnQgKS5yZWFkeSggZGlzcGxheUNvbnNvbGVOb3RpZmljYXRpb25zICk7XG5cblx0LyoqXG5cdCAqIFVzZWQgdG8gZGlzbWlzcyB0aGUgdGFnbGluZSBub3RpY2UgZm9yIGEgc3BlY2lmaWMgdXNlci5cblx0ICpcblx0ICogQHBhcmFtIHtzdHJpbmd9IG5vbmNlXG5cdCAqXG5cdCAqIEByZXR1cm5zIHt2b2lkfVxuXHQgKi9cblx0ZnVuY3Rpb24gd3BzZW9EaXNtaXNzVGFnbGluZU5vdGljZSggbm9uY2UgKSB7XG5cdFx0alF1ZXJ5LnBvc3QoIGFqYXh1cmwsIHtcblx0XHRcdGFjdGlvbjogXCJ3cHNlb19kaXNtaXNzX3RhZ2xpbmVfbm90aWNlXCIsXG5cdFx0XHRfd3Bub25jZTogbm9uY2UsXG5cdFx0fVxuXHRcdCk7XG5cdH1cblxuXHQvKipcblx0ICogVXNlZCB0byByZW1vdmUgdGhlIGFkbWluIG5vdGljZXMgZm9yIHNldmVyYWwgcHVycG9zZXMsIGRpZXMgb24gZXhpdC5cblx0ICpcblx0ICogQHBhcmFtIHtzdHJpbmd9IG9wdGlvblxuXHQgKiBAcGFyYW0ge3N0cmluZ30gaGlkZVxuXHQgKiBAcGFyYW0ge3N0cmluZ30gbm9uY2Vcblx0ICpcblx0ICogQHJldHVybnMge3ZvaWR9XG5cdCAqL1xuXHRmdW5jdGlvbiB3cHNlb1NldElnbm9yZSggb3B0aW9uLCBoaWRlLCBub25jZSApIHtcblx0XHRqUXVlcnkucG9zdCggYWpheHVybCwge1xuXHRcdFx0YWN0aW9uOiBcIndwc2VvX3NldF9pZ25vcmVcIixcblx0XHRcdG9wdGlvbjogb3B0aW9uLFxuXHRcdFx0X3dwbm9uY2U6IG5vbmNlLFxuXHRcdH0sIGZ1bmN0aW9uKCBkYXRhICkge1xuXHRcdFx0aWYgKCBkYXRhICkge1xuXHRcdFx0XHRqUXVlcnkoIFwiI1wiICsgaGlkZSApLmhpZGUoKTtcblx0XHRcdFx0alF1ZXJ5KCBcIiNoaWRkZW5faWdub3JlX1wiICsgb3B0aW9uICkudmFsKCBcImlnbm9yZVwiICk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdCk7XG5cdH1cblxuXHQvKipcblx0ICogR2VuZXJhdGVzIGEgZGlzbWlzc2FibGUgYW5jaG9yIGJ1dHRvbi5cblx0ICpcblx0ICogQHBhcmFtIHtzdHJpbmd9IGRpc21pc3NfbGluayBUaGUgVVJMIHRoYXQgbGVhZHMgdG8gdGhlIGRpc21pc3Npbmcgb2YgdGhlIG5vdGljZS5cblx0ICpcblx0ICogQHJldHVybnMge09iamVjdH0gQW5jaG9yIHRvIGRpc21pc3MuXG5cdCAqL1xuXHRmdW5jdGlvbiB3cHNlb0Rpc21pc3NMaW5rKCBkaXNtaXNzX2xpbmsgKSB7XG5cdFx0cmV0dXJuIGpRdWVyeShcblx0XHRcdCc8YSBocmVmPVwiJyArIGRpc21pc3NfbGluayArICdcIiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJub3RpY2UtZGlzbWlzc1wiPicgK1xuXHRcdFx0JzxzcGFuIGNsYXNzPVwic2NyZWVuLXJlYWRlci10ZXh0XCI+RGlzbWlzcyB0aGlzIG5vdGljZS48L3NwYW4+JyArXG5cdFx0XHRcIjwvYT5cIlxuXHRcdCk7XG5cdH1cblxuXHRqUXVlcnkoIGRvY3VtZW50ICkucmVhZHkoIGZ1bmN0aW9uKCkge1xuXHRcdGpRdWVyeSggXCIueW9hc3QtZGlzbWlzc2libGVcIiApLm9uKCBcImNsaWNrXCIsIFwiLnlvYXN0LW5vdGljZS1kaXNtaXNzXCIsIGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyICRwYXJlbnREaXYgPSBqUXVlcnkoIHRoaXMgKS5wYXJlbnQoKTtcblxuXHRcdFx0Ly8gRGVwcmVjYXRlZCwgdG9kbzogcmVtb3ZlIHdoZW4gYWxsIG5vdGlmaWVycyBoYXZlIGJlZW4gaW1wbGVtZW50ZWQuXG5cdFx0XHRqUXVlcnkucG9zdChcblx0XHRcdFx0YWpheHVybCxcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGFjdGlvbjogJHBhcmVudERpdi5hdHRyKCBcImlkXCIgKS5yZXBsYWNlKCAvLS9nLCBcIl9cIiApLFxuXHRcdFx0XHRcdF93cG5vbmNlOiAkcGFyZW50RGl2LmRhdGEoIFwibm9uY2VcIiApLFxuXHRcdFx0XHRcdGRhdGE6ICRwYXJlbnREaXYuZGF0YSggXCJqc29uXCIgKSxcblx0XHRcdFx0fVxuXHRcdFx0KTtcblxuXHRcdFx0alF1ZXJ5LnBvc3QoXG5cdFx0XHRcdGFqYXh1cmwsXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRhY3Rpb246IFwieW9hc3RfZGlzbWlzc19ub3RpZmljYXRpb25cIixcblx0XHRcdFx0XHRub3RpZmljYXRpb246ICRwYXJlbnREaXYuYXR0ciggXCJpZFwiICksXG5cdFx0XHRcdFx0bm9uY2U6ICRwYXJlbnREaXYuZGF0YSggXCJub25jZVwiICksXG5cdFx0XHRcdFx0ZGF0YTogJHBhcmVudERpdi5kYXRhKCBcImpzb25cIiApLFxuXHRcdFx0XHR9XG5cdFx0XHQpO1xuXG5cdFx0XHQkcGFyZW50RGl2LmZhZGVUbyggMTAwLCAwLCBmdW5jdGlvbigpIHtcblx0XHRcdFx0JHBhcmVudERpdi5zbGlkZVVwKCAxMDAsIGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdCRwYXJlbnREaXYucmVtb3ZlKCk7XG5cdFx0XHRcdH0gKTtcblx0XHRcdH0gKTtcblxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH0gKTtcblxuXHRcdGpRdWVyeSggXCIueW9hc3QtaGVscC1idXR0b25cIiApLm9uKCBcImNsaWNrXCIsIGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyICRidXR0b24gPSBqUXVlcnkoIHRoaXMgKSxcblx0XHRcdFx0aGVscFBhbmVsID0galF1ZXJ5KCBcIiNcIiArICRidXR0b24uYXR0ciggXCJhcmlhLWNvbnRyb2xzXCIgKSApLFxuXHRcdFx0XHRpc1BhbmVsVmlzaWJsZSA9IGhlbHBQYW5lbC5pcyggXCI6dmlzaWJsZVwiICk7XG5cblx0XHRcdGpRdWVyeSggaGVscFBhbmVsICkuc2xpZGVUb2dnbGUoIDIwMCwgZnVuY3Rpb24oKSB7XG5cdFx0XHRcdCRidXR0b24uYXR0ciggXCJhcmlhLWV4cGFuZGVkXCIsICEgaXNQYW5lbFZpc2libGUgKTtcblx0XHRcdH0gKTtcblx0XHR9ICk7XG5cdH0gKTtcblx0d2luZG93Lndwc2VvRGlzbWlzc1RhZ2xpbmVOb3RpY2UgPSB3cHNlb0Rpc21pc3NUYWdsaW5lTm90aWNlO1xuXHR3aW5kb3cud3BzZW9TZXRJZ25vcmUgPSB3cHNlb1NldElnbm9yZTtcblx0d2luZG93Lndwc2VvRGlzbWlzc0xpbmsgPSB3cHNlb0Rpc21pc3NMaW5rO1xuXG5cdC8qKlxuXHQgKiBIaWRlcyBwb3B1cCBzaG93aW5nIG5ldyBhbGVydHMgbWVzc2FnZS5cblx0ICpcblx0ICogQHJldHVybnMge3ZvaWR9XG5cdCAqL1xuXHRmdW5jdGlvbiBoaWRlQWxlcnRQb3B1cCgpIHtcblx0XHQvLyBSZW1vdmUgdGhlIG5hbWVzcGFjZWQgaG92ZXIgZXZlbnQgZnJvbSB0aGUgbWVudSB0b3AgbGV2ZWwgbGlzdCBpdGVtcy5cblx0XHQkKCBcIiN3cC1hZG1pbi1iYXItcm9vdC1kZWZhdWx0ID4gbGlcIiApLm9mZiggXCJob3Zlci55b2FzdGFsZXJ0cG9wdXBcIiApO1xuXHRcdC8vIEhpZGUgdGhlIG5vdGlmaWNhdGlvbiBwb3B1cCBieSBmYWRpbmcgaXQgb3V0LlxuXHRcdCQoIFwiLnlvYXN0LWlzc3VlLWFkZGVkXCIgKS5mYWRlT3V0KCAyMDAgKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBTaG93cyBwb3B1cCB3aXRoIG5ldyBhbGVydHMgbWVzc2FnZS5cblx0ICpcblx0ICogQHJldHVybnMge3ZvaWR9XG5cdCAqL1xuXHRmdW5jdGlvbiBzaG93QWxlcnRQb3B1cCgpIHtcblx0XHQvLyBBdHRhY2ggYW4gaG92ZXIgZXZlbnQgYW5kIHNob3cgdGhlIG5vdGlmaWNhdGlvbiBwb3B1cCBieSBmYWRpbmcgaXQgaW4uXG5cdFx0JCggXCIueW9hc3QtaXNzdWUtYWRkZWRcIiApXG5cdFx0XHQub24oIFwiaG92ZXJcIiwgZnVuY3Rpb24oIGV2dCApIHtcblx0XHRcdFx0Ly8gQXZvaWQgdGhlIGhvdmVyIGV2ZW50IHRvIHByb3BhZ2F0ZSBvbiB0aGUgcGFyZW50IGVsZW1lbnRzLlxuXHRcdFx0XHRldnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0XHRcdC8vIEhpZGUgdGhlIG5vdGlmaWNhdGlvbiBwb3B1cCB3aGVuIGhvdmVyaW5nIG9uIGl0LlxuXHRcdFx0XHRoaWRlQWxlcnRQb3B1cCgpO1xuXHRcdFx0fSApXG5cdFx0XHQuZmFkZUluKCk7XG5cblx0XHQvKlxuXHRcdCAqIEF0dGFjaCBhIG5hbWVzcGFjZWQgaG92ZXIgZXZlbnQgb24gdGhlIG1lbnUgdG9wIGxldmVsIGl0ZW1zIHRvIGhpZGVcblx0XHQgKiB0aGUgbm90aWZpY2F0aW9uIHBvcHVwIHdoZW4gaG92ZXJpbmcgdGhlbS5cblx0XHQgKiBOb3RlOiB0aGlzIHdpbGwgd29yayBqdXN0IHRoZSBmaXJzdCB0aW1lIHRoZSBsaXN0IGl0ZW1zIGdldCBob3ZlcmVkIGluIHRoZVxuXHRcdCAqIGZpcnN0IDMgc2Vjb25kcyBhZnRlciBET00gcmVhZHkgYmVjYXVzZSB0aGlzIGV2ZW50IGlzIHRoZW4gcmVtb3ZlZC5cblx0XHQgKi9cblx0XHQkKCBcIiN3cC1hZG1pbi1iYXItcm9vdC1kZWZhdWx0ID4gbGlcIiApLm9uKCBcImhvdmVyLnlvYXN0YWxlcnRwb3B1cFwiLCBoaWRlQWxlcnRQb3B1cCApO1xuXG5cdFx0Ly8gSGlkZSB0aGUgbm90aWZpY2F0aW9uIHBvcHVwIGFmdGVyIDMgc2Vjb25kcyBmcm9tIERPTSByZWFkeS5cblx0XHRzZXRUaW1lb3V0KCBoaWRlQWxlcnRQb3B1cCwgMzAwMCApO1xuXHR9XG5cblx0LyoqXG5cdCAqIEhhbmRsZXMgZGlzbWlzcyBhbmQgcmVzdG9yZSBBSkFYIHJlc3BvbnNlcy5cblx0ICpcblx0ICogQHBhcmFtIHtPYmplY3R9ICRzb3VyY2UgT2JqZWN0IHRoYXQgdHJpZ2dlcmVkIHRoZSByZXF1ZXN0LlxuXHQgKiBAcGFyYW0ge09iamVjdH0gcmVzcG9uc2UgQUpBWCByZXNwb25zZS5cblx0ICpcblx0ICogQHJldHVybnMge3ZvaWR9XG5cdCAqL1xuXHRmdW5jdGlvbiBoYW5kbGVEaXNtaXNzUmVzdG9yZVJlc3BvbnNlKCAkc291cmNlLCByZXNwb25zZSApIHtcblx0XHQkKCBcIi55b2FzdC1hbGVydC1ob2xkZXJcIiApLm9mZiggXCJjbGlja1wiLCBcIi5yZXN0b3JlXCIgKS5vZmYoIFwiY2xpY2tcIiwgXCIuZGlzbWlzc1wiICk7XG5cblx0XHRpZiAoIHR5cGVvZiByZXNwb25zZS5odG1sID09PSBcInVuZGVmaW5lZFwiICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdGlmICggcmVzcG9uc2UuaHRtbCApIHtcblx0XHRcdCRzb3VyY2UuY2xvc2VzdCggXCIueW9hc3QtY29udGFpbmVyXCIgKS5odG1sKCByZXNwb25zZS5odG1sICk7XG5cdFx0XHQvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXG5cdFx0XHQvKiBlc2xpbnQtZGlzYWJsZSAqL1xuXHRcdFx0aG9va0Rpc21pc3NSZXN0b3JlQnV0dG9ucygpO1xuXHRcdFx0LyoganNoaW50IGlnbm9yZTplbmQgKi9cblx0XHRcdC8qIGVzbGludC1lbmFibGUgKi9cblx0XHR9XG5cblx0XHR2YXIgJHdwc2VvX21lbnUgPSAkKCBcIiN3cC1hZG1pbi1iYXItd3BzZW8tbWVudVwiICk7XG5cdFx0dmFyICRpc3N1ZV9jb3VudGVyID0gJHdwc2VvX21lbnUuZmluZCggXCIueW9hc3QtaXNzdWUtY291bnRlclwiICk7XG5cblx0XHRpZiAoICEgJGlzc3VlX2NvdW50ZXIubGVuZ3RoICkge1xuXHRcdFx0JHdwc2VvX21lbnUuZmluZCggXCI+IGE6Zmlyc3QtY2hpbGRcIiApLmFwcGVuZCggJzxkaXYgY2xhc3M9XCJ5b2FzdC1pc3N1ZS1jb3VudGVyXCIvPicgKTtcblx0XHRcdCRpc3N1ZV9jb3VudGVyID0gJHdwc2VvX21lbnUuZmluZCggXCIueW9hc3QtaXNzdWUtY291bnRlclwiICk7XG5cdFx0fVxuXG5cdFx0JGlzc3VlX2NvdW50ZXIuaHRtbCggcmVzcG9uc2UudG90YWwgKTtcblx0XHRpZiAoIHJlc3BvbnNlLnRvdGFsID09PSAwICkge1xuXHRcdFx0JGlzc3VlX2NvdW50ZXIuaGlkZSgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQkaXNzdWVfY291bnRlci5zaG93KCk7XG5cdFx0fVxuXG5cdFx0JCggXCIjdG9wbGV2ZWxfcGFnZV93cHNlb19kYXNoYm9hcmQgLnVwZGF0ZS1wbHVnaW5zXCIgKS5yZW1vdmVDbGFzcygpLmFkZENsYXNzKCBcInVwZGF0ZS1wbHVnaW5zIGNvdW50LVwiICsgcmVzcG9uc2UudG90YWwgKTtcblx0XHQkKCBcIiN0b3BsZXZlbF9wYWdlX3dwc2VvX2Rhc2hib2FyZCAucGx1Z2luLWNvdW50XCIgKS5odG1sKCByZXNwb25zZS50b3RhbCApO1xuXHR9XG5cblx0LyoqXG5cdCAqIEhvb2tzIHRoZSByZXN0b3JlIGFuZCBkaXNtaXNzIGJ1dHRvbnMuXG5cdCAqXG5cdCAqIEByZXR1cm5zIHt2b2lkfVxuXHQgKi9cblx0ZnVuY3Rpb24gaG9va0Rpc21pc3NSZXN0b3JlQnV0dG9ucygpIHtcblx0XHR2YXIgJGRpc21pc3NpYmxlID0gJCggXCIueW9hc3QtYWxlcnQtaG9sZGVyXCIgKTtcblxuXHRcdCRkaXNtaXNzaWJsZS5vbiggXCJjbGlja1wiLCBcIi5kaXNtaXNzXCIsIGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyICR0aGlzID0gJCggdGhpcyApO1xuXHRcdFx0dmFyICRzb3VyY2UgPSAkdGhpcy5jbG9zZXN0KCBcIi55b2FzdC1hbGVydC1ob2xkZXJcIiApO1xuXG5cdFx0XHR2YXIgJGNvbnRhaW5lciA9ICR0aGlzLmNsb3Nlc3QoIFwiLnlvYXN0LWNvbnRhaW5lclwiICk7XG5cdFx0XHQkY29udGFpbmVyLmFwcGVuZCggJzxkaXYgY2xhc3M9XCJ5b2FzdC1jb250YWluZXItZGlzYWJsZWRcIi8+JyApO1xuXG5cdFx0XHQkdGhpcy5maW5kKCBcInNwYW5cIiApLnJlbW92ZUNsYXNzKCBcImRhc2hpY29ucy1uby1hbHRcIiApLmFkZENsYXNzKCBcImRhc2hpY29ucy1yYW5kb21pemVcIiApO1xuXG5cdFx0XHQkLnBvc3QoXG5cdFx0XHRcdGFqYXh1cmwsXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRhY3Rpb246IFwieW9hc3RfZGlzbWlzc19hbGVydFwiLFxuXHRcdFx0XHRcdG5vdGlmaWNhdGlvbjogJHNvdXJjZS5hdHRyKCBcImlkXCIgKSxcblx0XHRcdFx0XHRub25jZTogJHNvdXJjZS5kYXRhKCBcIm5vbmNlXCIgKSxcblx0XHRcdFx0XHRkYXRhOiAkc291cmNlLmRhdGEoIFwianNvblwiICksXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGhhbmRsZURpc21pc3NSZXN0b3JlUmVzcG9uc2UuYmluZCggdGhpcywgJHNvdXJjZSApLFxuXHRcdFx0XHRcImpzb25cIlxuXHRcdFx0KTtcblx0XHR9ICk7XG5cblx0XHQkZGlzbWlzc2libGUub24oIFwiY2xpY2tcIiwgXCIucmVzdG9yZVwiLCBmdW5jdGlvbigpIHtcblx0XHRcdHZhciAkdGhpcyA9ICQoIHRoaXMgKTtcblx0XHRcdHZhciAkc291cmNlID0gJHRoaXMuY2xvc2VzdCggXCIueW9hc3QtYWxlcnQtaG9sZGVyXCIgKTtcblxuXHRcdFx0dmFyICRjb250YWluZXIgPSAkdGhpcy5jbG9zZXN0KCBcIi55b2FzdC1jb250YWluZXJcIiApO1xuXHRcdFx0JGNvbnRhaW5lci5hcHBlbmQoICc8ZGl2IGNsYXNzPVwieW9hc3QtY29udGFpbmVyLWRpc2FibGVkXCIvPicgKTtcblxuXHRcdFx0JHRoaXMuZmluZCggXCJzcGFuXCIgKS5yZW1vdmVDbGFzcyggXCJkYXNoaWNvbnMtYXJyb3ctdXBcIiApLmFkZENsYXNzKCBcImRhc2hpY29ucy1yYW5kb21pemVcIiApO1xuXG5cdFx0XHQkLnBvc3QoXG5cdFx0XHRcdGFqYXh1cmwsXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRhY3Rpb246IFwieW9hc3RfcmVzdG9yZV9hbGVydFwiLFxuXHRcdFx0XHRcdG5vdGlmaWNhdGlvbjogJHNvdXJjZS5hdHRyKCBcImlkXCIgKSxcblx0XHRcdFx0XHRub25jZTogJHNvdXJjZS5kYXRhKCBcIm5vbmNlXCIgKSxcblx0XHRcdFx0XHRkYXRhOiAkc291cmNlLmRhdGEoIFwianNvblwiICksXG5cdFx0XHRcdH0sXG5cdFx0XHRcdGhhbmRsZURpc21pc3NSZXN0b3JlUmVzcG9uc2UuYmluZCggdGhpcywgJHNvdXJjZSApLFxuXHRcdFx0XHRcImpzb25cIlxuXHRcdFx0KTtcblx0XHR9ICk7XG5cdH1cblxuXHQvKipcblx0ICogU2V0cyB0aGUgY29sb3Igb2YgdGhlIHN2ZyBmb3IgdGhlIHByZW1pdW0gaW5kaWNhdG9yIGJhc2VkIG9uIHRoZSBjb2xvciBvZiB0aGUgY29sb3Igc2NoZW1lLlxuXHQgKlxuXHQgKiBAcmV0dXJucyB7dm9pZH1cblx0ICovXG5cdGZ1bmN0aW9uIHNldFByZW1pdW1JbmRpY2F0b3JDb2xvcigpIHtcblx0XHRsZXQgJHByZW1pdW1JbmRpY2F0b3IgPSBqUXVlcnkoIFwiLndwc2VvLWpzLXByZW1pdW0taW5kaWNhdG9yXCIgKTtcblx0XHRsZXQgJHN2ZyA9ICRwcmVtaXVtSW5kaWNhdG9yLmZpbmQoIFwic3ZnXCIgKTtcblxuXHRcdC8vIERvbid0IGNoYW5nZSB0aGUgY29sb3IgdG8gc3RhbmQgb3V0IHdoZW4gcHJlbWl1bSBpcyBhY3R1YWxseSBlbmFibGVkLlxuXHRcdGlmICggJHByZW1pdW1JbmRpY2F0b3IuaGFzQ2xhc3MoIFwid3BzZW8tcHJlbWl1bS1pbmRpY2F0b3ItLW5vXCIgKSApIHtcblx0XHRcdGxldCAkc3ZnUGF0aCA9ICRzdmcuZmluZCggXCJwYXRoXCIgKTtcblxuXHRcdFx0bGV0IGJhY2tncm91bmRDb2xvciA9ICRwcmVtaXVtSW5kaWNhdG9yLmNzcyggXCJiYWNrZ3JvdW5kQ29sb3JcIiApO1xuXG5cdFx0XHQkc3ZnUGF0aC5jc3MoIFwiZmlsbFwiLCBiYWNrZ3JvdW5kQ29sb3IgKTtcblx0XHR9XG5cblx0XHQkc3ZnLmNzcyggXCJkaXNwbGF5XCIsIFwiYmxvY2tcIiApO1xuXHRcdCRwcmVtaXVtSW5kaWNhdG9yLmNzcygge1xuXHRcdFx0YmFja2dyb3VuZENvbG9yOiBcInRyYW5zcGFyZW50XCIsXG5cdFx0XHR3aWR0aDogXCIyMHB4XCIsXG5cdFx0XHRoZWlnaHQ6IFwiMjBweFwiLFxuXHRcdH0gKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBDaGVja3MgYSBzY3JvbGxhYmxlIHRhYmxlIHdpZHRoLlxuXHQgKlxuXHQgKiBDb21wYXJlcyB0aGUgc2Nyb2xsYWJsZSB0YWJsZSB3aWR0aCBhZ2FpbnN0IHRoZSBzaXplIG9mIGl0cyBjb250YWluZXIgYW5kXG5cdCAqIGFkZHMgb3IgcmVtb3ZlcyBDU1MgY2xhc3NlcyBhY2NvcmRpbmdseS5cblx0ICpcblx0ICogQHBhcmFtIHtvYmplY3R9IHRhYmxlIEEgalF1ZXJ5IG9iamVjdCB3aXRoIG9uZSBzY3JvbGxhYmxlIHRhYmxlLlxuXHQgKiBAcmV0dXJucyB7dm9pZH1cblx0ICovXG5cdGZ1bmN0aW9uIGNoZWNrU2Nyb2xsYWJsZVRhYmxlU2l6ZSggdGFibGUgKSB7XG5cdFx0Ly8gQmFpbCBpZiB0aGUgdGFibGUgaXMgaGlkZGVuLlxuXHRcdGlmICggdGFibGUuaXMoIFwiOmhpZGRlblwiICkgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8gV2hlbiB0aGUgdGFibGUgaXMgd2lkZXIgdGhhbiBpdHMgcGFyZW50LCBtYWtlIGl0IHNjcm9sbGFibGUuXG5cdFx0aWYgKCB0YWJsZS5vdXRlcldpZHRoKCkgPiB0YWJsZS5wYXJlbnQoKS5vdXRlcldpZHRoKCkgKSB7XG5cdFx0XHR0YWJsZS5kYXRhKCBcInNjcm9sbEhpbnRcIiApLmFkZENsYXNzKCBcInlvYXN0LWhhcy1zY3JvbGxcIiApO1xuXHRcdFx0dGFibGUuZGF0YSggXCJzY3JvbGxDb250YWluZXJcIiApLmFkZENsYXNzKCBcInlvYXN0LWhhcy1zY3JvbGxcIiApO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0YWJsZS5kYXRhKCBcInNjcm9sbEhpbnRcIiApLnJlbW92ZUNsYXNzKCBcInlvYXN0LWhhcy1zY3JvbGxcIiApO1xuXHRcdFx0dGFibGUuZGF0YSggXCJzY3JvbGxDb250YWluZXJcIiApLnJlbW92ZUNsYXNzKCBcInlvYXN0LWhhcy1zY3JvbGxcIiApO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiBDaGVja3MgdGhlIHdpZHRoIG9mIG11bHRpcGxlIHNjcm9sbGFibGUgdGFibGVzLlxuXHQgKlxuXHQgKiBAcGFyYW0ge29iamVjdH0gdGFibGVzIEEgalF1ZXJ5IGNvbGxlY3Rpb24gb2Ygc2Nyb2xsYWJsZSB0YWJsZXMuXG5cdCAqIEByZXR1cm5zIHt2b2lkfVxuXHQgKi9cblx0ZnVuY3Rpb24gY2hlY2tNdWx0aXBsZVNjcm9sbGFibGVUYWJsZXNTaXplKCB0YWJsZXMgKSB7XG5cdFx0dGFibGVzLmVhY2goIGZ1bmN0aW9uKCkge1xuXHRcdFx0Y2hlY2tTY3JvbGxhYmxlVGFibGVTaXplKCAkKCB0aGlzICkgKTtcblx0XHR9ICk7XG5cdH1cblxuXHQvKipcblx0ICogTWFrZXMgdGFibGVzIHNjcm9sbGFibGUuXG5cdCAqXG5cdCAqIFVzYWdlOiBzZWUgcmVsYXRlZCBzdHlsZXNoZWV0LlxuXHQgKlxuXHQgKiBAcmV0dXJucyB7dm9pZH1cblx0ICovXG5cdGZ1bmN0aW9uIGNyZWF0ZVNjcm9sbGFibGVUYWJsZXMoKSB7XG5cdFx0Ly8gR2V0IHRoZSB0YWJsZXMgZWxlY3RlZCB0byBiZSBzY3JvbGxhYmxlIGFuZCBzdG9yZSB0aGVtIGZvciBsYXRlciByZXVzZS5cblx0XHR3aW5kb3cud3BzZW9TY3JvbGxhYmxlVGFibGVzID0gJCggXCIueW9hc3QtdGFibGUtc2Nyb2xsYWJsZVwiICk7XG5cblx0XHQvLyBCYWlsIGlmIHRoZXJlIGFyZSBubyB0YWJsZXMuXG5cdFx0aWYgKCAhIHdpbmRvdy53cHNlb1Njcm9sbGFibGVUYWJsZXMubGVuZ3RoICkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIExvb3Agb3ZlciB0aGUgY29sbGVjdGlvbiBvZiB0YWJsZXMgYW5kIGJ1aWxkIHNvbWUgSFRNTCBhcm91bmQgdGhlbS5cblx0XHR3aW5kb3cud3BzZW9TY3JvbGxhYmxlVGFibGVzLmVhY2goIGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIHRhYmxlID0gJCggdGhpcyApO1xuXG5cdFx0XHQvKlxuXHRcdFx0ICogQ3JlYXRlIGFuIGVsZW1lbnQgd2l0aCBhIGhpbnQgbWVzc2FnZSBhbmQgaW5zZXJ0IGl0IGluIHRoZSBET01cblx0XHRcdCAqIGJlZm9yZSBlYWNoIHRhYmxlLlxuXHRcdFx0ICovXG5cdFx0XHR2YXIgc2Nyb2xsSGludCA9ICQoIFwiPGRpdiAvPlwiLCB7XG5cdFx0XHRcdFwiY2xhc3NcIjogXCJ5b2FzdC10YWJsZS1zY3JvbGxhYmxlX19oaW50d3JhcHBlclwiLFxuXHRcdFx0XHRodG1sOiBcIjxzcGFuIGNsYXNzPSd5b2FzdC10YWJsZS1zY3JvbGxhYmxlX19oaW50JyBhcmlhLWhpZGRlbj0ndHJ1ZScgLz5cIixcblx0XHRcdH0gKS5pbnNlcnRCZWZvcmUoIHRhYmxlICk7XG5cblx0XHRcdC8qXG5cdFx0XHQgKiBDcmVhdGUgYSB3cmFwcGVyIGVsZW1lbnQgd2l0aCBhbiBpbm5lciBkaXYgbmVjZXNzYXJ5IGZvclxuXHRcdFx0ICogc3R5bGluZyBhbmQgaW5zZXJ0IHRoZW0gaW4gdGhlIERPTSBiZWZvcmUgZWFjaCB0YWJsZS5cblx0XHRcdCAqL1xuXHRcdFx0dmFyIHNjcm9sbENvbnRhaW5lciA9ICQoIFwiPGRpdiAvPlwiLCB7XG5cdFx0XHRcdFwiY2xhc3NcIjogXCJ5b2FzdC10YWJsZS1zY3JvbGxhYmxlX19jb250YWluZXJcIixcblx0XHRcdFx0aHRtbDogXCI8ZGl2IGNsYXNzPSd5b2FzdC10YWJsZS1zY3JvbGxhYmxlX19pbm5lcicgLz5cIixcblx0XHRcdH0gKS5pbnNlcnRCZWZvcmUoIHRhYmxlICk7XG5cblx0XHRcdC8vIFNldCB0aGUgaGludCBtZXNzYWdlIHRleHQuXG5cdFx0XHRzY3JvbGxIaW50LmZpbmQoIFwiLnlvYXN0LXRhYmxlLXNjcm9sbGFibGVfX2hpbnRcIiApLnRleHQoIHdwc2VvQWRtaW5HbG9iYWxMMTBuLnNjcm9sbGFibGVfdGFibGVfaGludCApO1xuXG5cdFx0XHQvLyBGb3IgZWFjaCB0YWJsZSwgc3RvcmUgYSByZWZlcmVuY2UgdG8gaXRzIHdyYXBwZXIgZWxlbWVudC5cblx0XHRcdHRhYmxlLmRhdGEoIFwic2Nyb2xsQ29udGFpbmVyXCIsIHNjcm9sbENvbnRhaW5lciApO1xuXG5cdFx0XHQvLyBGb3IgZWFjaCB0YWJsZSwgc3RvcmUgYSByZWZlcmVuY2UgdG8gaXRzIGhpbnQgbWVzc2FnZS5cblx0XHRcdHRhYmxlLmRhdGEoIFwic2Nyb2xsSGludFwiLCBzY3JvbGxIaW50ICk7XG5cblx0XHRcdC8vIE1vdmUgdGhlIHNjcm9sbGFibGUgdGFibGUgaW5zaWRlIHRoZSB3cmFwcGVyLlxuXHRcdFx0dGFibGUuYXBwZW5kVG8oIHNjcm9sbENvbnRhaW5lci5maW5kKCBcIi55b2FzdC10YWJsZS1zY3JvbGxhYmxlX19pbm5lclwiICkgKTtcblxuXHRcdFx0Ly8gQ2hlY2sgZWFjaCB0YWJsZSdzIHdpZHRoLlxuXHRcdFx0Y2hlY2tTY3JvbGxhYmxlVGFibGVTaXplKCB0YWJsZSApO1xuXHRcdH0gKTtcblx0fVxuXG5cdC8qXG5cdCAqIFdoZW4gdGhlIHZpZXdwb3J0IHNpemUgY2hhbmdlcywgY2hlY2sgYWdhaW4gdGhlIHNjcm9sbGFibGUgdGFibGVzIHdpZHRoLlxuXHQgKiBBYm91dCB0aGUgZXZlbnRzOiB0ZWNobmljYWxseSBgd3Atd2luZG93LXJlc2l6ZWRgIGlzIHRyaWdnZXJlZCBvbiB0aGVcblx0ICogYm9keSBidXQgc2luY2UgaXQgYnViYmxlcywgaXQgaGFwcGVucyBhbHNvIG9uIHRoZSB3aW5kb3cuXG5cdCAqIEFsc28sIGluc3RlYWQgb2YgdHJ5aW5nIHRvIGRldGVjdCBldmVudHMgc3VwcG9ydCBvbiBkZXZpY2VzIGFuZCBicm93c2Vycyxcblx0ICogd2UganVzdCBydW4gdGhlIGNoZWNrIG9uIGJvdGggYHdwLXdpbmRvdy1yZXNpemVkYCBhbmQgYG9yaWVudGF0aW9uY2hhbmdlYC5cblx0ICovXG5cdCQoIHdpbmRvdyApLm9uKCBcIndwLXdpbmRvdy1yZXNpemVkIG9yaWVudGF0aW9uY2hhbmdlXCIsIGZ1bmN0aW9uKCkge1xuXHRcdC8vIEJhaWwgaWYgdGhlcmUgYXJlIG5vIHRhYmxlcy5cblx0XHRpZiAoICEgd2luZG93Lndwc2VvU2Nyb2xsYWJsZVRhYmxlcy5sZW5ndGggKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Y2hlY2tNdWx0aXBsZVNjcm9sbGFibGVUYWJsZXNTaXplKCB3aW5kb3cud3BzZW9TY3JvbGxhYmxlVGFibGVzICk7XG5cdH0gKTtcblxuXHQkKCBkb2N1bWVudCApLnJlYWR5KCBmdW5jdGlvbigpIHtcblx0XHRzaG93QWxlcnRQb3B1cCgpO1xuXHRcdGhvb2tEaXNtaXNzUmVzdG9yZUJ1dHRvbnMoKTtcblx0XHRzZXRQcmVtaXVtSW5kaWNhdG9yQ29sb3IoKTtcblx0XHRjcmVhdGVTY3JvbGxhYmxlVGFibGVzKCk7XG5cdH0gKTtcblxuXHQvKipcblx0ICogU3RhcnRzIHZpZGVvIGlmIGZvdW5kIG9uIHRoZSB0YWIuXG5cdCAqXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSAkdGFiIFRhYiB0aGF0IGlzIGFjdGl2YXRlZC5cblx0ICpcblx0ICogQHJldHVybnMge3ZvaWR9XG5cdCAqL1xuXHRmdW5jdGlvbiBhY3RpdmF0ZVZpZGVvKCAkdGFiICkge1xuXHRcdHZhciAkZGF0YSA9ICR0YWIuZmluZCggXCIud3BzZW8tdGFiLXZpZGVvX19kYXRhXCIgKTtcblx0XHRpZiAoICRkYXRhLmxlbmd0aCA9PT0gMCApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHQkZGF0YS5hcHBlbmQoICc8aWZyYW1lIHdpZHRoPVwiNTYwXCIgaGVpZ2h0PVwiMzE1XCIgc3JjPVwiJyArICRkYXRhLmRhdGEoIFwidXJsXCIgKSArICdcIiB0aXRsZT1cIicgKyB3cHNlb0FkbWluR2xvYmFsTDEwbi5oZWxwX3ZpZGVvX2lmcmFtZV90aXRsZSArICdcIiBmcmFtZWJvcmRlcj1cIjBcIiBhbGxvd2Z1bGxzY3JlZW4+PC9pZnJhbWU+JyApO1xuXHR9XG5cblx0LyoqXG5cdCAqIFN0b3BzIHBsYXlpbmcgYW55IHZpZGVvLlxuXHQgKlxuXHQgKiBAcmV0dXJucyB7dm9pZH1cblx0ICovXG5cdGZ1bmN0aW9uIHN0b3BWaWRlb3MoKSB7XG5cdFx0JCggXCIjd3Bib2R5LWNvbnRlbnRcIiApLmZpbmQoIFwiLndwc2VvLXRhYi12aWRlb19fZGF0YVwiICkuY2hpbGRyZW4oKS5yZW1vdmUoKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBPcGVucyBhIHRhYi5cblx0ICpcblx0ICogQHBhcmFtIHtvYmplY3R9ICRjb250YWluZXIgQ29udGFpbmVyIHRoYXQgY29udGFpbnMgdGhlIHRhYi5cblx0ICogQHBhcmFtIHtvYmplY3R9ICR0YWIgVGFiIHRoYXQgaXMgYWN0aXZhdGVkLlxuXHQgKlxuXHQgKiBAcmV0dXJucyB7dm9pZH1cblx0ICovXG5cdGZ1bmN0aW9uIG9wZW5IZWxwQ2VudGVyVGFiKCAkY29udGFpbmVyLCAkdGFiICkge1xuXHRcdCRjb250YWluZXIuZmluZCggXCIueW9hc3QtaGVscC1jZW50ZXItdGFicy13cmFwIGRpdlwiICkucmVtb3ZlQ2xhc3MoIFwiYWN0aXZlXCIgKTtcblx0XHQkdGFiLmFkZENsYXNzKCBcImFjdGl2ZVwiICk7XG5cblx0XHRzdG9wVmlkZW9zKCk7XG5cdFx0YWN0aXZhdGVWaWRlbyggJHRhYiApO1xuXHRcdGNoZWNrTXVsdGlwbGVTY3JvbGxhYmxlVGFibGVzU2l6ZSggJHRhYi5maW5kKCBcIi55b2FzdC10YWJsZS1zY3JvbGxhYmxlXCIgKSApO1xuXHR9XG5cblx0LyoqXG5cdCAqIE9wZW5zIHRoZSBWaWRlbyBTbGlkZW91dC5cblx0ICpcblx0ICogQHBhcmFtIHtvYmplY3R9ICRjb250YWluZXIgVGFiIHRvIG9wZW4gdmlkZW8gc2xpZGVyIG9mLlxuXHQgKlxuXHQgKiBAcmV0dXJucyB7dm9pZH1cblx0ICovXG5cdGZ1bmN0aW9uIG9wZW5WaWRlb1NsaWRlb3V0KCAkY29udGFpbmVyICkge1xuXHRcdCRjb250YWluZXIuZmluZCggXCIudG9nZ2xlX19hcnJvd1wiICkucmVtb3ZlQ2xhc3MoIFwiZGFzaGljb25zLWFycm93LWRvd25cIiApLmFkZENsYXNzKCBcImRhc2hpY29ucy1hcnJvdy11cFwiICk7XG5cdFx0JGNvbnRhaW5lci5maW5kKCBcIi53cHNlby10YWItdmlkZW8tY29udGFpbmVyX19oYW5kbGVcIiApLmF0dHIoIFwiYXJpYS1leHBhbmRlZFwiLCBcInRydWVcIiApO1xuXHRcdCRjb250YWluZXIuZmluZCggXCIud3BzZW8tdGFiLXZpZGVvLXNsaWRlb3V0XCIgKS5yZW1vdmVDbGFzcyggXCJoaWRkZW5cIiApO1xuXG5cdFx0dmFyICRhY3RpdmVUYWJMaW5rID0gJGNvbnRhaW5lci5maW5kKCBcIi53cHNlby1oZWxwLWNlbnRlci1pdGVtLmFjdGl2ZSA+IGFcIiApO1xuXG5cdFx0JCggXCIjd3Bjb250ZW50XCIgKS5hZGRDbGFzcyggXCJ5b2FzdC1oZWxwLWNlbnRlci1vcGVuXCIgKTtcblxuXHRcdGlmICggJGFjdGl2ZVRhYkxpbmsubGVuZ3RoID4gMCApIHtcblx0XHRcdHZhciBhY3RpdmVUYWJJZCA9ICRhY3RpdmVUYWJMaW5rLmF0dHIoIFwiYXJpYS1jb250cm9sc1wiICksXG5cdFx0XHRcdGFjdGl2ZVRhYiA9ICQoIFwiI1wiICsgYWN0aXZlVGFiSWQgKTtcblxuXHRcdFx0YWN0aXZhdGVWaWRlbyggYWN0aXZlVGFiICk7XG5cblx0XHRcdGNoZWNrTXVsdGlwbGVTY3JvbGxhYmxlVGFibGVzU2l6ZSggYWN0aXZlVGFiLmZpbmQoIFwiLnlvYXN0LXRhYmxlLXNjcm9sbGFibGVcIiApICk7XG5cblx0XHRcdCRjb250YWluZXIub24oIFwiY2xpY2tcIiwgXCIud3BzZW8taGVscC1jZW50ZXItaXRlbSA+IGFcIiwgZnVuY3Rpb24oIGUgKSB7XG5cdFx0XHRcdHZhciAkbGluayA9ICQoIHRoaXMgKTtcblx0XHRcdFx0dmFyIHRhcmdldCA9ICRsaW5rLmF0dHIoIFwiYXJpYS1jb250cm9sc1wiICk7XG5cblx0XHRcdFx0JGNvbnRhaW5lci5maW5kKCBcIi53cHNlby1oZWxwLWNlbnRlci1pdGVtXCIgKS5yZW1vdmVDbGFzcyggXCJhY3RpdmVcIiApO1xuXHRcdFx0XHQkbGluay5wYXJlbnQoKS5hZGRDbGFzcyggXCJhY3RpdmVcIiApO1xuXG5cdFx0XHRcdG9wZW5IZWxwQ2VudGVyVGFiKCAkY29udGFpbmVyLCAkKCBcIiNcIiArIHRhcmdldCApICk7XG5cblx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0fSApO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBUb2RvOiBjb25zaWRlciBpZiBzY3JvbGxhYmxlIHRhYmxlcyBuZWVkIHRvIGJlIGNoZWNrZWQgaGVyZSB0b28uXG5cdFx0XHRhY3RpdmF0ZVZpZGVvKCAkY29udGFpbmVyICk7XG5cdFx0fVxuXG5cdFx0JCggXCIjc2lkZWJhci1jb250YWluZXJcIiApLmhpZGUoKTtcblx0fVxuXG5cdC8qKlxuXHQgKiBDbG9zZXMgdGhlIFZpZGVvIFNsaWRlb3V0LlxuXHQgKlxuXHQgKiBAcmV0dXJucyB7dm9pZH1cblx0ICovXG5cdGZ1bmN0aW9uIGNsb3NlVmlkZW9TbGlkZW91dCgpIHtcblx0XHR2YXIgJGNvbnRhaW5lciA9ICQoIFwiI3dwYm9keS1jb250ZW50XCIgKS5maW5kKCBcIi53cHNlby10YWItdmlkZW8tY29udGFpbmVyXCIgKTtcblx0XHQkY29udGFpbmVyLmZpbmQoIFwiLndwc2VvLXRhYi12aWRlby1zbGlkZW91dFwiICkuYWRkQ2xhc3MoIFwiaGlkZGVuXCIgKTtcblxuXHRcdHN0b3BWaWRlb3MoKTtcblxuXHRcdCRjb250YWluZXIuZmluZCggXCIudG9nZ2xlX19hcnJvd1wiICkucmVtb3ZlQ2xhc3MoIFwiZGFzaGljb25zLWFycm93LXVwXCIgKS5hZGRDbGFzcyggXCJkYXNoaWNvbnMtYXJyb3ctZG93blwiICk7XG5cdFx0JGNvbnRhaW5lci5maW5kKCBcIi53cHNlby10YWItdmlkZW8tY29udGFpbmVyX19oYW5kbGVcIiApLmF0dHIoIFwiYXJpYS1leHBhbmRlZFwiLCBcImZhbHNlXCIgKTtcblxuXHRcdCQoIFwiI3dwY29udGVudFwiICkucmVtb3ZlQ2xhc3MoIFwieW9hc3QtaGVscC1jZW50ZXItb3BlblwiICk7XG5cdFx0JCggXCIjc2lkZWJhci1jb250YWluZXJcIiApLnNob3coKTtcblx0fVxuXG5cdCQoIFwiLm5hdi10YWJcIiApLmNsaWNrKCBmdW5jdGlvbigpIHtcblx0XHRjbG9zZVZpZGVvU2xpZGVvdXQoKTtcblx0fSApO1xuXG5cdCQoIFwiLndwc2VvLXRhYi12aWRlby1jb250YWluZXJcIiApLm9uKCBcImNsaWNrXCIsIFwiLndwc2VvLXRhYi12aWRlby1jb250YWluZXJfX2hhbmRsZVwiLCBmdW5jdGlvbiggZSApIHtcblx0XHR2YXIgJGNvbnRhaW5lciA9ICQoIGUuZGVsZWdhdGVUYXJnZXQgKTtcblx0XHR2YXIgJHNsaWRlb3V0ID0gJGNvbnRhaW5lci5maW5kKCBcIi53cHNlby10YWItdmlkZW8tc2xpZGVvdXRcIiApO1xuXHRcdGlmICggJHNsaWRlb3V0Lmhhc0NsYXNzKCBcImhpZGRlblwiICkgKSB7XG5cdFx0XHRvcGVuVmlkZW9TbGlkZW91dCggJGNvbnRhaW5lciApO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRjbG9zZVZpZGVvU2xpZGVvdXQoKTtcblx0XHR9XG5cdH0gKTtcblxuXHQvLyBTZXQgdGhlIHlvYXN0LXRvb2x0aXBzIG9uIHRoZSBsaXN0IHRhYmxlIGxpbmtzIGNvbHVtbnMuXG5cdCQoIFwiLnlvYXN0LWNvbHVtbi1oZWFkZXItaGFzLXRvb2x0aXBcIiApLmVhY2goIGZ1bmN0aW9uKCkge1xuXHRcdHZhciBwYXJlbnRMaW5rID0gJCggdGhpcyApLmNsb3Nlc3QoIFwiYVwiICk7XG5cblx0XHRwYXJlbnRMaW5rXG5cdFx0XHQuYWRkQ2xhc3MoIFwieW9hc3QtdG9vbHRpcCB5b2FzdC10b29sdGlwLW4geW9hc3QtdG9vbHRpcC1tdWx0aWxpbmVcIiApXG5cdFx0XHQuYXR0ciggXCJhcmlhLWxhYmVsXCIsICQoIHRoaXMgKS5kYXRhKCBcImxhYmVsXCIgKSApO1xuXHR9KVxuXG59KCBqUXVlcnkgKSApO1xuIl19
