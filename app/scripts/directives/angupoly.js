'use strict';
angular.module('angupoly', [])
  .directive('angupoly', function($rootScope, $parse, $timeout, $q) {
    var PathObserver = window.PathObserver;
    return {
      priority: 42,
      restrict: 'A',
      compile: function(tElement, tAttr) {
        var conf = $rootScope.$eval(tAttr.angupoly);
        var assignables = {};
        var paths = {};
        var needsMutationObserver;

        Object.keys(conf).forEach(function(attrName) {
          var path = conf[attrName],
            parse = $parse(path);
          if (parse.assign) {
            assignables[attrName] = parse.assign;
            needsMutationObserver = true;
          }
          paths[attrName] = path;
        });
        return function(scope, element) {
          var el = element[0];

          // from angular scope to attribute
          // http://www.polymer-project.org/platform/node_bind.html
          for (var attrName in paths) {
            el.bind(attrName, new PathObserver(scope, paths[attrName]));
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
                var mutation,
                  updates,
                  i = 0;
                while ((mutation = mutations[i++])) {
                  for (var attrName in assignables) {
                    if (mutation.attributeName === attrName && attrName !== 'value') {
                      assignables[attrName](scope, mutation.target[attrName]);
                      updates = true;
                    }
                  }
                }
                if (updates) {
                  scope.$apply();
                }
              }).observe(el, {
                attributes: true
              });
            }

            //use change events for the value property since the attribute isn't updated by inputs
            if (paths.value) {
              element.bind('blur, change, keyup', function() {
                assignables.value(scope, element[0].inputValue);
                scope.$apply();
              });

              scope.$watch(paths.value, function() {
                element[0].inputValue = scope[paths.value];
              });
            }
          });
        };
      }
    };
  });