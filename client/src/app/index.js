'use strict';

/*We need to manually start angular as we need to
 wait for the google charting libs to be ready*/
var bootstrapApp;
google.setOnLoadCallback(function () {
  bootstrapApp = angular.bootstrap(document.body, ['metrics']);
});

google.load('visualization', '1', {packages: ["piechart", "corechart", "gauge"]});

var myApp = bootstrapApp || angular.module('metrics',
    [
      'ngAnimate',
      'ngCookies',
      'ngTouch',
      'ngSanitize',
      'ngResource',
      'angular-websocket',
      'ui.router'
    ]);

myApp.config(function ($stateProvider, $urlRouterProvider) {
  $stateProvider
    .state('home', {
      url: '/',
      templateUrl: 'app/main/main.html',
      controller: 'MainCtrl'
    });

  $urlRouterProvider.otherwise('/');
})
;
