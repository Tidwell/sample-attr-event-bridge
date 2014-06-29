'use strict';

/**
 * @ngdoc function
 * @name polytstApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the polytstApp
 */
angular.module('polytstApp')
  .controller('AboutCtrl', function ($scope) {
  	$scope.var1 = 'avalue';
  	$scope.var2 = false;

  	$scope.myobj = {
  		someprop: {
  			anotherprop: {
  				var1: 'another value',
  				bool: false
  			}
  		}
  	};

  	$scope.selectorOneItemList = [
  		'Zero',
  		'First',
  		'Second',
  		'Third',
  		'Fourth'
  	]

  	$scope.opened = false;
  	$scope.duration = 1;
  	$scope.fixedSize = true;
  	$scope.horizontal = false;

  	$scope.selectorOne = 0;
  	$scope.selectorTwo = [];
  });
