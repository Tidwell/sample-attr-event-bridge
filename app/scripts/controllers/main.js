'use strict';

/**
 * @ngdoc function
 * @name polytstApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the polytstApp
 */
angular.module('polytstApp')
  .controller('MainCtrl', function ($scope) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
  });
