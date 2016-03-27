/**
	* Executes the angular for the page
	* Used to get the forumPath & user values
	*
	* @param {String}  forumPath  -  the forum's path; ex: '/', '/forum'
	* @param {String}  userToken  -  the user's token from req.user in lib/routes/index.js
	**/

function executeAngular (forumPath, userToken) { //

	var token = userToken || null;

	const pathname = document.location.pathname;

	if (pathname === forumPath + 'login' || pathname === forumPath + 'signup') {
		history.replaceState({}, 'Log In - FlarumJS', forumPath);
	}

	var app = angular.module('flarum', [ 'angularMoment' ]);

	app.config(function ($interpolateProvider) {
		$interpolateProvider.startSymbol('[[');
		$interpolateProvider.endSymbol(']]');
	});

	/**
		* Function to check if user is signed in
		*
		**/

		var isLoggedIn = false;

	const checkIfLoggedIn = function () { //
		var http = new XMLHttpRequest();
		http.onreadystatechange = function () {
			if (http.readyState == 4 && http.status == 200) {
				var data = JSON.parse(http.responseText);
				console.log(data);
				if (!data.success) return false;
				isLoggedIn = true;
			} else if (http.readyState == 4 && http.status == 500) {
				var data = http.responseText;
				errorToast('Oops! Something went wrong on the server. Please reload the page and try again.', data)
			}
		}
		http.open('POST', forumPath + 'api/login/checkCredentials', true);
		http.send('token=' + token);
	};

	checkIfLoggedIn();

	// TOASTR OPTIONS
	toastr.options.showMethod       = 'fadeIn';
	toastr.options.hideMethod       = 'slideUp';
	toastr.options.closeMethod      = 'slideUp';
	toastr.options.closeButton      = true;
	toastr.options.showDuration     = 1000;  // 1s
	toastr.options.hideDuration     = 1000;  // 1s
	toastr.options.timeOut          = 7500;  // 7.5s
	toastr.options.extendedTimeOut  = 10000; // 10s

	app.factory('flarumjsApi', function ($http) {

		return {

			getParameterByName: function (par, url) {
				if (!url) url = window.location.href;
    		url = url.toLowerCase(); // This is just to avoid case sensitiveness
    		par = par.replace(/[\[\]]/g, "\\$&").toLowerCase();// This is just to avoid case sensitiveness for query parameter name
    		var regex = new RegExp("[?&]" + par + "(=([^&#]*)|&|#|$)"),
    		results = regex.exec(url);
    		if (!results) return null;
    		if (!results[2]) return '';
    		return decodeURIComponent(results[2].replace(/\+/g, " "));
    	},

    	getDiscussions: function (options, callback) {
    		if (typeof options == 'function') {
    			callback = options;
    			options = {};
    		}

    		$http({
    			method: 'GET',
    			url: forumPath + 'api/discussions?q=' + options.q + '&tag=' + options.tag
    		}).then(function (response) {
    			data = response.data;
    			callback(null, data);
    			return data;
    		}, function (response) {
    			var data = response.data;
    			callback(data, data);
    			return data;
    		})
    	}

    }

  });

	app.controller('DiscussionListController', [ 'flarumjsApi', '$http', function (flarumjsApi, $http) {

		var controller = this;

		var tag = document.location.pathname.indexOf('/t/') >= 0 && document.href.pathname.replace('/t/', '') || "";

		/**
			* Gets the discussion list from the api and displays them
			* by using angularjs
		**/ //

		this.getDiscussions = function () {
			controller.loaded = false;
			flarumjsApi.getDiscussions({
				tag: tag,
				q: flarumjsApi.getParameterByName('q')
			}, function (err, data) {

				if (err) {
					controller.noDiscussions = true;
					errorToast('Error while trying to get discussions!', err.error);
				} else if (data.posts) {
					controller.noDiscussions = false;
					controller.discussions = data.posts
				} else if (data.noPosts) {
					controller.noDiscussions = true;
					controller.discussions = [];
				}

				controller.loaded = true;

			});
		}

		this.getDiscussions();
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

			if (!isLoggedIn) {
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

			if (!isLoggedIn) {
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
				url: forumPath + 'api/discussions',
				data: {
					token: token,
					title: controller.newDiscussionTitle,
					content: controller.newDiscussionContent
				}
			}).then(function (response) {

				console.log(response);

			}, function (response) {

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
			url: forumPath + 'api/discussions/' + index,
			data: {
				index: index
			}
		}).then(function (response) {

			var data = response.data;

			if (data.postNotFound) {
				controller.postNotFound = true;
				return false;
			}
			if (data.error) {
				toastr.error(data.error, null, {
					allowHtml: true,
					positionClass: 'toast-bottom-left',
					toastClass: 'toast'
				});
			}

			controller.post = data.post;
		}, function (response) {
			controller.loading = false;
			errorToast('Error while trying to get discussions!', data.error);
		})

	}]);

	app.controller('SignController', [ '$http', function ($http) {

		var controller = this;

		/**
			* Function to sign up the user;
			* Uses AngularJS
			**/
		this.signUp = function () { //

			var errors = '';

			if (!controller.signup_username) errors += 'Please enter a username<br/>';
			if (!controller.signup_email) errors += 'Please enter an email<br/>';
			if (!controller.signup_password) errors += 'Please enter a password<br/>';
			if (!controller.signup_passwordCheck) errors += 'Please reenter the password<br/>';
			if (controller.signup_password && controller.signup_passwordCheck && controller.signup_password != controller.signup_passwordCheck) errors += 'Passwords do not match<br/>';

			if (errors !== '') {
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
			}).then(function (response) {

				data = response.data;

				if (data.errors.length > 0) {
					errors += '<b>The following errors occured while trying to sign you up:</b><br/>';

					for (var i = 0; i < data.errors.length; i++) {
						errors += data.errors[i];
						if (i == data.errors.length - 1) {
							errorToast(errors);
						}
					}

					return false;
				}

				document.location.assign(forumPath + 'auth/local/callback?username=' + controller.signup_username + '&password=' + controller.signup_password);

			}, function (response) {

				var data = response.data;

				if (response.status === 401) {
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

		this.logIn = function () { //

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
			}).then(function (response) {

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

				document.location.assign(forumPath + 'auth/local/callback?username=' + controller.signin_username + '&password=' + controller.signin_password);

			}, function (response) {

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


	var errorToast = function (message, error) {
		var html = `<span class=\"Alert-body\" data-error=\"${error}\">${message}<\/span>`;
		if (error) {
			html += "	<ul class=\"Alert-controls\">" +
			"						<li>" +
			"							<button class=\"Button Button--link\" type=\"button\"><span class=\"Button-label\">Debug<\/span>" +
			"							<\/button>" +
			"						<\/li>" +
			"					<\/ul>";
		}

		toastr.clear()

		toastr.error(html, null, {
			allowHtml: true,
			positionClass: 'toast-bottom-left',
			toastClass: 'toast',
			tapToDismiss: false,
			closeButton: true
		});
	}
}
