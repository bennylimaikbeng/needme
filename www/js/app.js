// Todo App
ionic.Gestures.gestures.Hold.defaults.hold_threshold = 20;
// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js

angular.module('todo', ['ionic', 'todo.services', 'todo.controllers', 'ngCordova', 'todo.sortable', 'ngTouch', 'monospaced.elastic', 'ionic-datepicker', 'ionic-timepicker', 'ngAnimate', 'ui.calendar'])

  .config(function($stateProvider, $urlRouterProvider) {
  
    // Ionic uses AngularUI Router which uses the concept of states
    // Learn more here: https://github.com/angular-ui/ui-router
    // Set up the various states which the app can be in.
    // Each state's controller can be found in controllers.js
    $stateProvider
  
    .state('home', {
      cache: false,
      url: '/',
      templateUrl: 'templates/todo-list.html',
      controller: 'todoCtrl'
        })

    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/');
  
  })

  .config(function (ionicDatePickerProvider) {
      var datePickerObj = {
        setLabel: 'Set',
        todayLabel: 'Today',
        closeLabel: 'Close',
        mondayFirst: false,
        weeksList: ["S", "M", "T", "W", "T", "F", "S"],
        monthsList: ["Jan", "Feb", "March", "April", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"],
        templateType: 'popup',
        showTodayButton: false,
        dateFormat: 'dd MMMM yyyy',
        closeOnSelect: true
      };
      ionicDatePickerProvider.configDatePicker(datePickerObj);
    })  

.config(function (ionicTimePickerProvider) {
    var timePickerObj = {
      format: 12,
      step: 1,
      setLabel: 'Set',
      closeLabel: 'Close'
    };
    ionicTimePickerProvider.configTimePicker(timePickerObj);
  })

.config(function($ionicConfigProvider) {
  // $ionicConfigProvider.views.maxCache(0);
  // note that you can also chain configs
  // $ionicConfigProvider.backButton.text('Go Back').icon('ion-chevron-left');
  $ionicConfigProvider.tabs.position('bottom');
})

.config(function($ionicConfigProvider,$stateProvider, $urlRouterProvider) {
    $ionicConfigProvider.tabs.style("standard");
})

.filter('renderHTMLCorrectly', function($sce)
{
  return function(stringToParse)
  {
    return $sce.trustAsHtml(stringToParse);
  }
})

.directive('imageonload', function() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            element.bind('load', function() {
                // alert('image is loaded');
                $('#infographicLoading').fadeOut();

            });
        }
    };
})




