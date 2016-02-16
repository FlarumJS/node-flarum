function executeAngular (forumPath, user) {

	user = user || { };

	var app = angular.module('flarum', [  ]);

	app.config(function ($interpolateProvider) {
		$interpolateProvider.startSymbol('[[');
		$interpolateProvider.endSymbol(']]');
	})

	// TOASTR OPTIONS
	toastr.options.showMethod 			= 'fadeIn';
	toastr.options.hideMethod 			= 'slideUp';
	toastr.options.closeMethod 			= 'slideUp';
	toastr.options.closeButton 			= true;
	toastr.options.showDuration 		= 1000;  // 1s
	toastr.options.hideDuration 		= 1000;  // 1s
	toastr.options.timeOut 					= 7500;  // 7.5s
	toastr.options.extendedTimeOut 	= 10000; // 10s

	app.controller('DiscussionListController', [ '$http', function ($http) {

		var controller = this;

		var tag = document.location.pathname.indexOf('/t/') >= 0 && document.href.pathname.replace('/t/', '') || undefined;

		this.getDiscussions = function () {
			controller.loaded = false;
			$http.post(forumPath + 'api/discussionList').then(function (response) {
				data = response.data;
				if (data.error) {
					// doSomethin
					toastr.error('Error while trying to get discussions! &nbsp;&nbsp;<a id=\"openDebug\" data-error=\"' + data.error + '\">DEBUG</a>', null, {
						allowHtml: true,
						positionClass: 'toast-bottom-left',
						toastClass: 'toast'
					})
				}
				if (data.noPosts) {
					controller.noDiscussions = true;
					controller.discussions = [];
				}
				if (data.posts) {
					controller.noDiscussions = false;
					controller.discussions = data.posts
				}
				controller.loaded = true;
			}, function errorCallback (response) {
				controller.loaded = false;
				toastr.error('Error while trying to get discussions! &nbsp;&nbsp;<a id=\"openDebug\" data-error=\"' + JSON.stringify(response, null, 2) + '\">DEBUG</a>', null, {
					allowHtml: true,
					positionClass: 'toast-bottom-left',
					toastClass: 'toast'
				});
			})
		}

		this.getDiscussions();

		// this.discussions = [
		// {
		// 	title: 'asljkdhf',
		// 	link: 'aisuldkfhjfdasfsa'
		// },
		// {
		// 	title: 'asljkdhf',
		// 	link: 'aisuldkfhjfdasfsa'
		// }
		// ]
	}]);

	app.controller('IndexSideNavController', [ '$http', '$document', function ($http, $document) { //

		var simplemde = new SimpleMDE({
			element: document.getElementById("NewDiscussionContent"),
			placeholder: 'Write a Post...'
		});

		simplemde.codemirror.on("change", function () {
			controller.newDiscussionContent = marked(simplemde.value());
			setTimeout(function () {
				Prism.highlightAll(true);
			}, 2500);
		});
		controller = this;

		controller.username = 'datitisev';

		controller.closeNewDiscussionView = function () {
			if (controller.newDiscussionTitle || simplemde.value()) {
				if (confirm('You have not posted your discussion. \n Are you sure you want to discard it?')) {
					controller.composerClass = '';
					controller.composerDivClass = '';
					controller.newDiscussionTitle = '';
					simplemde.value('');
					controller.showNewDiscussion = false;
					controller.hideNewDiscussion = false;
				}
			} else {
				controller.composerClass = '';
				controller.composerDivClass = '';
			}
		}

		controller.showNewDiscussionView = function () {
			controller.composerClass = 'show';
			controller.composerDivClass = '';
			controller.hideNewDiscussion = false;
			controller.showNewDiscussion = true;
		}

		controller.postNewDiscussion = function () {

			controller.postNewDiscussionError = false;
			controller.postNewDiscussionErrorMessage = '';
			controller.newDiscussionTitleClass = '';
			controller.newDiscussionContentClass = '';

			if (!controller.newDiscussionTitle || controller.newDiscussionTitle.length < 10) {
				controller.postNewDiscussionError = true;
				controller.newDiscussionTitleClass = 'error';

				controller.postNewDiscussionErrorMessage += 'The title is missing or it is too short<br/>Please be more specific with the title<br/><small>Minimum 10 characters</small><hr/>';
			}

			if (!controller.newDiscussionContent || controller.newDiscussionContent.length < 30) {
				controller.postNewDiscussionError = true;
				controller.newDiscussionContentClass = 'error';

				controller.postNewDiscussionErrorMessage += 'The content is missing or it is too short<br/><small>Minimum 30 characters</small>';
			}

			if (controller.postNewDiscussionError) {
				errorToast('<b>Could Not Post Discussion:</b><br/>' + controller.postNewDiscussionErrorMessage);
				return false;
			}

			$http({
				method: 'POST',
				url: forumPath + 'api/postNewDiscussion',
				data: {
					user: user,
					title: controller.newDiscussionTitle,
					content: controller.newDiscussionContent
				}
			}).then(function successCallback (response) {

				console.log(response);

			}, function errorCallback (response) {

				console.log(response);

			});

		}

	}]);

	app.controller('DiscussionViewController', [ '$http', function ($http) {

		var controller = this;

		var slug = document.location.pathname.replace(forumPath, '/').replace('/d/', '');
		var index = parseInt(slug.split('-')[0])

		$http({
			method: 'GET',
			url: forumPath + 'api/getDiscussion',
			data: {
				index: index,
				slug: slug
			}
		}).then(function successCallback (response) {

			var data = response.data

			if (data.postNotFound) return controller.postNotFound = true;
			if (data.error) {
				toastr.error(data.error, null, {
					allowHtml: true,
					positionClass: 'toast-bottom-left',
					toastClass: 'toast'
				});
			}

			controller.post = data.post;
		}, function errorCallback (response) {
			controller.loading = false;
			// toastr.error('Error while trying to get discussion! &nbsp;&nbsp;<a id=\"openDebug\" data-error=\"' + JSON.stringify(response, null, 2) + '\">DEBUG</a>', null, {
			// 	allowHtml: true,
			// 	positionClass: 'toast-bottom-left',
			// 	toastClass: 'toast'
			// });
		})

	}]);


	var errorToast = function (html) {
		toastr.error(html, null, {
			allowHtml: true,
			positionClass: 'toast-bottom-left',
			toastClass: 'toast'
		});
	}

}
