angular.module('firebaseResource', []).

factory('firebaseResource', function($injector, $rootScope, $log, $timeout, $filter, $q, firebase) {


  $rootScope.safeApply = function(fn) {
    var phase = this.$root.$$phase;
    if(phase == '$apply' || phase == '$digest') {
      if(fn && (typeof(fn) === 'function')) {
        fn();
      }
    } else {
      this.$apply(fn);
    }
  };

  function firebaseResourceFactory(opts) {
    var options = opts ? opts : {};
    var map = {};
    var list = [];
    var listenerPaths = {};
    options.perPage = opts.perPage ? opts.perPage : 10;
    var globalLimit = opts.limit ? opts.limit : 1000;
    if (opts.path) {
      var resourceRef = firebase.child(opts.path);
      var resourcePath = firebase.path;
      // var resourceQuery = firebase.child(opts.path).limit(globalLimit);
      if (!opts.belongsTo) {
        setListeners(opts.path, options);
      }
    }

    function Resource(data) {
      angular.copy(data || {}, this);
      var _this = this;
      if (this.id) {
        setAssociations(this)
      };
    }

    /***** Private Methods *****/

    function setAssociations(self) {
        var _this = self;
        angular.forEach(options.hasMany, function(model) {
          model = $injector.get(model);
          var parent_path = Resource.getPath() + "/" + _this.id;
          var parent_rels_path = Resource.getPath() + "/" + _this.id + "/rels/" + model.getName() + "/";
          if (parent_path && !_this[model.getName()]) {
            _this["_" + model.getName()] = [];

            _this[model.getName()] = function() {
              return {
                query: function(opts, callback) {
                  var opts = opts ? opts : {};
                  opts.path = parent_rels_path;
                  opts.parent = _this;
                  return model.query(opts, callback);
                },
                all: function(opts) {
                  var opts = opts ? opts : {};
                  opts.parent = _this;
                  return model.all(opts);
                },
                new: function(data) {
                  var data = data ? data : {}
                  data["_" + Resource.getName() + "_parent_id"] = _this.id;
                  data._parent_path = parent_path;
                  data._parent_rels_path = parent_rels_path;
                  return new model(data);
                },
                add: function(obj) {
                  var deferred = $q.defer();
                  if (!obj._parent_rels_path) {
                    firebase.child(parent_rels_path + obj.id).once('value', function(s) {
                      if (s.val()) {
                        deferred.resolve(_this);
                      } else {
                        firebase.child(parent_rels_path).once('value', function(parentRels) {
                          var priority = parentRels.val() ? Object.keys(parentRels.val()).length : 1;
                          firebase.child(parent_rels_path + obj.id).setWithPriority(true, priority, function(error) {
                            if (error) {
                              $log.info('something went wrong: ' + error);
                            } else {
                               deferred.resolve(_this);
                               $rootScope.safeApply();
                            }
                          });
                        });
                      }
                    })
                  }
                  return deferred.promise;
                }
              };
            };
          };
        });
    }

    function ensureRels(obj, relName) {
      if (!obj.rels) {
        obj.rels = {};
      }
      if (!obj.rels[relName]) {
        obj.rels[relName] = {};
      }
    }

    function getPagingQuery(parent, path, page) {
      var perPage = options.perPage;
      if (parent && page) {
        ensureRels(parent, Resource.getName());
        var total = Object.keys(parent.rels[Resource.getName()]).length;
        var end = total-perPage*(page-1);
        var start = total-perPage*page;
        $log.info("start: " + start + ", end: " + end);
        start = start < 1 ? 1 : start; // start cannot be less than 1;
        end = end < start ? start : end; // end cannot be less than start;
        if (page == 1) {
          var query = firebase.child(path).startAt(start);
          $log.info('no end');
        } else {
          var query = firebase.child(path).endAt(end).startAt(start);
        }

        path += "?page=" + page;
        $log.info("start: " + start + ", end: " + end + ", path:" +path);
        return query;
      } else {
        return false;
      }
    }

    function setListeners(path, opts, callback) {
      var opts = opts ? opts : {};
      var query = getPagingQuery(opts.parent, path, opts.page);
      if (!query) { query = firebase.child(path); };
      if (opts.page) { path += "?page=" + opts.page; };
      if (!listenerPaths[path]) {
        listenerPaths[path] = true;

        query.on('child_added', function(snapshot) {
          $log.info('child_added');

          if (opts.parent) {
            firebase.child(Resource.getPath() + "/" + snapshot.name()).once('value', function(snap) {
              if (snap.val()) {
                var resource = updateResource(snap);
                resource.init();
                // add local variable for parent for filtering purposes.
                resource["_" + opts.parent.getName() + "_parent_id"] = opts.parent.id;
                resource._parent_path = opts.parent.getName() + "/" + opts.parent.id;
                resource._parent_rels_path = opts.parent.getName() + "/" + opts.parent.id + "/rels/" + Resource.getName() + "/";
                refreshRels(opts.parent);
                if (callback) {
                  callback(resource);
                }
              }
            })
          } else {
            var resource = updateResource(snapshot);
            resource.init();
            $rootScope.safeApply();
          }
        });

        resourceRef.on('child_removed', function(snapshot) {
          $log.info('child_removed');
          removeResource(snapshot);
          if (opts.parent) {
            refreshRels(opts.parent);
          }
          $rootScope.safeApply();
        });

        query.on('child_changed', function(snapshot) {
          $log.info('child_changed');
          updateResource(snapshot);
          $rootScope.safeApply();
        });

      }
    }

    function removeResource(snapshot) {
      var name = snapshot.name ? snapshot.name() : snapshot.id;
      if (map[name]) {
        var index = list.indexOf(map[name]);
        list.splice(index, 1);
        delete map[name];
      }
    }

    function updateResource(snapshot) {
      var name = snapshot.name();
      var data = snapshot.val();
      if (data) {
        if (map[name]) {
          angular.forEach(data, function(val, key) {
            map[name][key] = val;
          });
          var resource = map[name];
        } else {
          data.id = name;
          var resource = new Resource(data);
          addResource(resource);
        }
        return resource;
      }
    }

    function addResource(resource) {
      map[resource.id] = resource;
      var listIndex = indexInList(resource.id);
      if (listIndex === -1) {
        list.push(map[resource.id])
      } else {
        list[listIndex] = map[resource.id];
      };
    }

    function refreshRels(parent) {
      var filterParams = {};
      filterParams["_" + parent.getName() + "_parent_id"] = parent.id;
      parent["_" + Resource.getName()] = $filter('filter')(list, filterParams);
      $rootScope.safeApply();
    }



    function indexInList(id) {
      var index = -1;
      for (var i in list) {
        if (list[i].id === id) {
          index = i;
        }
      }
      return index;
    }

    function timestamp(resource) {
      resource.updated_at = Firebase.ServerValue.TIMESTAMP
      if (!resource.created_at) {
        resource.created_at = Firebase.ServerValue.TIMESTAMP
      }
    }

    function getSaveableAttrs(resource) {
      var toSave = {};
      for (var key in resource) {
        if (typeof(resource[key]) !== "function" &&
          key.charAt(0) !== "$" &&
          key !== "rels" &&
          key.charAt(0) !== "_") {
          toSave[key] = resource[key];
        }
      };
      return toSave;
    }


    /***** Class Methods *****/


    Resource.getName = function() {
      return resourceRef.name();
    }

    Resource.getPath = function() {
      return resourceRef.path.toString();
    }

    Resource.clearAll = function() {
      map = {};
      list = [];
    }

    Resource.find = function(id) {
      return map[id];
    }

    Resource.findAsync = function(id) {
      var deferred = $q.defer();
      if (map[id]) {
        $timeout(function() {
          $rootScope.safeApply(function() {
            deferred.resolve(map[id]);
          })
        }, 0)
      } else {
        resourceRef.child(id).once('value', function(snapshot) {
          var resource = updateResource(snapshot);
          map[id] = resource;
          $rootScope.safeApply(function() {
            deferred.resolve(map[id]);
          });
        });
      }

      return deferred.promise;
    }

    Resource.all = function(opts) {
      var opts = opts ? opts : {}
      var ret = list;
      if (opts.parent) {
        ret = opts.parent["_" + Resource.getName()];
      }
      if (opts.limit && opts.limit <= ret.length) {
        ret = ret.slice(ret.length - opts.limit, ret.length);
      }
      return ret;
    }

    Resource.query = function(opts, callback) {
      var deferred = $q.defer();
      var opts = opts ? opts : {}
      var ret = list;
      var path = opts.path ? opts.path : Resource.getPath();
      setListeners(path, opts, callback);
      return deferred.promise;
    }


    /***** Instance Methods *****/


    Resource.prototype.getName = function() {
      return Resource.getName();
    }

    Resource.prototype.getTimestamp = function(attr) {
      var date = new Date(this[attr]);
      return date.getTime();
    }



    Resource.prototype.save = function() {
      this.beforeSave();
      timestamp(this);

      var deferred = $q.defer(),
          newResource = false,
          _this = this,
          toSave = getSaveableAttrs(this),
          ref = this.id ? resourceRef.child(this.id) : resourceRef.push();

      if (!this.id) {
        this.id = ref.name();
        setAssociations(this);
        newResource = true;
      }

      ref.update(toSave, function(error) {
        $rootScope.safeApply(function() {
          if (error) {
            deferred.reject(error);
          } else {
            // addResource(_this);
            if (_this._parent_rels_path && newResource) {
              firebase.child(_this._parent_rels_path).once('value', function(parentRels) {
                var priority = parentRels.val() ? Object.keys(parentRels.val()).length : 1;
                firebase.child(_this._parent_rels_path + _this.id).setWithPriority(true, priority);
              });
            };

            _this.afterSave();
            if (newResource) {
              _this.afterCreate();
            };
            deferred.resolve(_this);
          };
        });
      });

      return deferred.promise;
    }

    Resource.prototype.delete = function() {

      if (this.id) {
        var ref = resourceRef.child(this.id);
        ref.remove();
        if (this._parent_rels_path) {
          firebase.child(this._parent_rels_path + this.id).remove();
        }
      }
    }


    // lifecycle callbacks - override in model
    Resource.prototype.init = function() { $log.info('initializing resource') }
    Resource.prototype.beforeSave = function() { $log.info('before save resource') }
    Resource.prototype.afterSave = function() { $log.info('after save resource') }
    Resource.prototype.afterCreate = function() { $log.info('after create resource') }


    return Resource;

  }

  return firebaseResourceFactory;

});
