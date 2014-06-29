'use strict';
angular.module('angupoly', [])
  .directive('angupoly', function($rootScope, $parse, $timeout, $q) {
    var PathObserver = window.PathObserver;
    return {
      priority: 42,
      restrict: 'A',
      compile: function(tElement, tAttr) {

        function needsBind(attr) {
          if (attr === 'value' || attr === 'selected') { return true; }
          return false;
        }
        //evaluate what scope attributes we want to bind to and create a hash of elementAttribute : scopeProperty
        var conf = $rootScope.$eval(tAttr.angupoly);
        //for caching the assignment functions for the scope properties
        var assignables = {};
        //for caching the scope paths for the attributes
        var paths = {};
        //if we need to create a mutation observer
        var needsMutationObserver;

        //go over all the attributes we want to bind to
        Object.keys(conf).forEach(function(attrName) {
          var path = conf[attrName]; //get the scope Property
          var parse = $parse(path); //get the assignment object for the scope property

          if (parse.assign) { //if there is an assignment function
            assignables[attrName] = parse.assign; //cache it
          }
          //if there is an assignment function and we aren't
          //looking for a attribute that we need to bind events to get updates
          if (parse.assign && !needsBind(attrName)) {
            needsMutationObserver = true; //we need to use a mutation observer for the attribute changes
          }
          //cache the assignment object for the attribute
          paths[attrName] = path;
        });

        //return the linking function
        return function(scope, element) {
          var el = element[0];

          // from angular scope to attribute
          // http://www.polymer-project.org/docs/polymer/node_bind.html
          for (var attrName in paths) {
            //dont use a path observer on something we need to bind to for proper changes,
            //if we do, it will collide with the watch binding
            if (!needsBind(attrName)) {
              el.bind(attrName, new PathObserver(scope, paths[attrName]));
            }
          }

          // Helper to wait for Polymer to expose the observe property
          // https://github.com/eee-c/angular-bind-polymer
          function onPolymerReady() {
            var deferred = $q.defer();

            function _checkForObserve() {
              if (element[0].observe) {
                deferred.resolve();
              } else {
                $timeout(_checkForObserve, 10);
              }
            }
            _checkForObserve();

            return deferred.promise;
          }

          // When Polymer is ready
          onPolymerReady().then(function() {
            if (needsMutationObserver) {
              // from attribute to angular scope
              // https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
              // http://caniuse.com/mutationobserver
              new MutationObserver(function(mutations) {
                //when a mutation occurs
                var mutation;
                var updates;
                var i = 0;
                //itterate over each mutation
                while ((mutation = mutations[i++])) {
                  //check only the properties we need
                  for (var attrName in assignables) {
                    //dont do attributes we have change events for
                    if (mutation.attributeName === attrName && !needsBind(attrName)) {
                      //set the angular scope value
                      assignables[attrName](scope, mutation.target[attrName]);
                      //flag that we will need to $apply
                      updates = true;
                    }
                  }
                }
                if (updates) {
                  scope.$apply();
                }
              }).observe(el, { //bind the mutation observer
                attributes: true
              });
            }

            //use change events for the value or selected property since the attribute isn't updated by inputs
            //.value isn't updated till blur, so we look at inputValue
            //(probably need a better way of declaring this)
            if (paths.value) {
              //when the polymer object fires any of the change events we want to update the angualr scope vars
              element.bind('blur, change, keyup', function() {
                //anything that inherits from polymer's core-input will expose inputValue
                assignables.value(scope, element[0].inputValue);
                scope.$apply();
              });
              //watch the angular scope var so we can update the element's inputValue attribute
              scope.$watch(paths.value, function() {
                element[0].inputValue = scope.$eval(paths.value);
              });
            }

            if (paths.selected) {
              element[0].addEventListener('core-select', function() {
                //anything that inherits from polymer's core-select will expose selected
                assignables.selected(scope, element[0].selected);
                scope.$apply();
              });
              //watch the angular scope var so we can update the element's selected attribute
              scope.$watch(paths.selected, function() {
                element[0].selected = scope.$eval(paths.selected);
              });
            }
          });
        };
      }
    };
  });