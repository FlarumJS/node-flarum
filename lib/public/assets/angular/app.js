(function () {

	var app = angular.module('flarum', [  ]);

	app.config(function ($interpolateProvider) {
		$interpolateProvider.startSymbol('[[');
		$interpolateProvider.endSymbol(']]');
	})

	// TOASTR
	toastr.options.showMethod = 'fadeIn';
	toastr.options.hideMethod = 'slideUp';
	toastr.options.closeMethod = 'slideUp';
	toastr.options.closeButton = true;

	app.controller('DiscussionListController', [ '$http', function ($http) {

		var controller = this;

		var tag = document.location.pathname.indexOf('/t/') >= 0 && document.href.pathname.replace('/t/', '') || undefined;

		this.getDiscussions = function () {
			controller.loaded = false;
			$http.post('/api/discussionList').then(function (response) {
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
			placeholer: 'Writa a Post...'
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
	}]);

app.controller('DiscussionViewController', [ '$http', function ($http) {

	controller = this;

	var slug = document.location.pathname.replace('/d/', '');
	var index = parseInt(slug.split('-')[0])

	$http({
		method: 'POST',
		url: '/api/getDiscussion',
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
			})
		}

		controller.post = data.post;

	}, function errorCallback (response) {
		controller.loading = false;
		toastr.error('Error while trying to get discussion! &nbsp;&nbsp;<a id=\"openDebug\" data-error=\"' + JSON.stringify(response, null, 2) + '\">DEBUG</a>', null, {
			allowHtml: true,
			positionClass: 'toast-bottom-left',
			toastClass: 'toast'
		});
	})

}])

})()
