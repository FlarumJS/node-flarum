/**
	* Executes the angular for the page
	* Used to get the forumPath & user values
	*
	* @param {String}  forumPath  -  the forum's path; ex: '/', '/forum'
	* @param {Object}  user       -  the user object from req.user in lib/routes/index.js
**/

function executeAngular (forumPath, user) {

	user = user || { };

	var pathname = document.location.pathname;

	if (pathname == forumPath + 'login' || pathname == forumPath + 'signup') {
		history.replaceState({}, 'Log In - FlarumJS', forumPath);
	}

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

		/**
			* Gets the discussion list from the api and displays them
			* by using angularjs
		**/

		this.getDiscussions = function () {
			controller.loaded = false;
			$http.post(forumPath + 'api/discussionList').then(function (response) {
				data = response.data;
				if (data.error) {
					// doSomethin
					controller.loaded = true;
					controller.noDiscussions = true;
					errorToast('Error while trying to get discussions! &nbsp;&nbsp;<a id=\"openDebug\" data-error=\"' + data.error || null + '\">DEBUG</a>');
					// toastr.error('Error while trying to get discussions! &nbsp;&nbsp;<a id=\"openDebug\" data-error=\"' + data.error + '\">DEBUG</a>', null, {
					// 	allowHtml: true,
					// 	positionClass: 'toast-bottom-left',
					// 	toastClass: 'toast'
					// })
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

				controller.loaded = true;
				controller.noDiscussions = true;
				errorToast('Error while trying to get discussions! &nbsp;&nbsp;<a id=\"openDebug\" data-error=\"' + response.data.error + '\">DEBUG</a>');
					// toastr.error('Error while trying to get discussions! &nbsp;&nbsp;<a id=\"openDebug\" data-error=\"' + data.error + '\">DEBUG</a>', null, {
					// 	allowHtml: true,
					// 	positionClass: 'toast-bottom-left',
					// 	toastClass: 'toast'
					// })
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

		var controller = this;

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

			if (!user || user == {} || !user.email) {
				errorToast('<b>Couldn\'t Make A New Discussion</b><br/>You need to be logged in to be able to post a new discussion.')
				return false;
			}

			controller.postNewDiscussionError = false;
			controller.postNewDiscussionErrorMessage = '';
			controller.newDiscussionTitleClass = '';
			controller.newDiscussionContentClass = '';

			controller.composerClass = 'show';
			controller.composerDivClass = '';
			controller.hideNewDiscussion = false;
			controller.showNewDiscussion = true;
		}

		controller.postNewDiscussion = function () {

			if (!user || user == {} || !user.email) {
				errorToast('<b>Couldn\'t Make A New Discussion</b><br/>You need to be logged in to be able to post a new discussion.')
				return false;
			}

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
			errorToast('Error while trying to get discussions! &nbsp;&nbsp;<a id=\"openDebug\" data-error=\"' + response.data + '\">DEBUG</a>');
		})

	}]);

	app.controller('SignController', [ '$http', function ($http) {

		var controller = this;

		/**
			* Function to sign up the user;
			* Uses AngularJS
		**/
		this.signUp = function () {

			var errors = '';

			if (!controller.signup_username) errors += 'Please enter a username<br/>';
			if (!controller.signup_email) errors += 'Please enter an email<br/>';
			if (!controller.signup_password) errors += 'Please enter a password<br/>';
			if (!controller.signup_passwordCheck) errors += 'Please reenter the password<br/>';
			if (controller.signup_password && controller.signup_passwordCheck && controller.signup_password != controller.signup_passwordCheck) errors += 'Passwords do not match<br/>';

			if (errors != '') {
				errors = '<b>The following errors occured while trying to sign you up:</b><br/>' + errors;
				errorToast(errors);
				return false;
			}

			$http({
				method: 'POST',
				url: forumPath + 'api/signup',
				data: {
					username: controller.signup_username,
					email: controller.signup_email,
					password: controller.signup_password,
					passwordCheck: controller.signup_passwordCheck
				}
			}).then(function successCallback (response) {

				console.log(response.data);

				data = response.data;

				if (data.errors.length > 0) {

					errors += '<b>The following errors occured while trying to sign you up:</b><br/>';

					for (var i = 0; i < data.errors.length; i++) {
						errors += data.errors[i];
						if (i == data.errors.length - 1) {
							errorToast(errors);
						}
					}

				}

				document.location.assign(forumPath + 'api/login?username=' + controller.signin_username + '&password=' + controller.signin_password);

			}, function errorCallback (response) {

				var data = response.data;

				if (response.status == 401) {

					errors += '<b>The following errors occured while trying to sign you up:</b><br/>';

					for (var i = 0; i < data.errors.length; i++) {
						errors += data.errors[i];
						if (i == data.errors.length - 1) {
							errorToast(errors);
						}
					}

				}

			})
		}

		/**
			* Function to login in the user;
			* Uses AngularJS
			* -
			* First, Checks if valid credentials & user exists.
			* If user doesn't exist, redirects user to /api/login to login.
			* If user exists, show error(s).
		**/

		this.logIn = function () {

			var errors = '';

			if (!controller.signin_username) errors += 'Please enter a username<br/>';
			if (!controller.signin_password) errors += 'Please enter a password<br/>';

			if (errors.length > 0) {
				errors = '<b>The following errors occured while trying to sign you up:</b><br/>' + errors;
				return errorToast(errors);
			}


			$http({
				method: 'POST',
				url: forumPath + 'api/login',
				data: {
					username: controller.signin_username,
					password: controller.signin_password
				}
			}).then(function successCallback (response) {

				data = response.data;

				if (data.errors.length > 0) {

					errors += '<b>The following errors occured while trying to sign you up:</b><br/>';

					for (var i = 0; i < data.errors.length; i++) {
						errors += data.errors[i];
						if (i == data.errors.length - 1) {
							errorToast(errors);
						}
					}

				}

				document.location.assign(forumPath + 'api/login?username=' + controller.signin_username + '&password=' + controller.signin_password);

			}, function errorCallback (response) {

				var data = response.data;

				if (response.status == 401) {

					errors += '<b>The following errors occured while trying to sign you up:</b><br/>';

					for (var i = 0; i < data.errors.length; i++) {
						errors += data.errors[i];
						if (i == data.errors.length - 1) {
							errorToast(errors);
						}
					}

				}

			})

		}

	}])


	var errorToast = function (html) {
		toastr.error(html, null, {
			allowHtml: true,
			positionClass: 'toast-bottom-left',
			toastClass: 'toast'
		});
	}

}
