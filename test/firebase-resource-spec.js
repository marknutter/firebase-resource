describe('Service: firebaseResource', function () {
  'use strict';
  var firebaseResource,
      Model,
      NestedModel,
      Bar,
      instance,
      snapshot,
      resource,
      rootScope,
      deferred,
      firebase,
      firebaseEvents = {},
      q,
      scope;

  function Firebase() {};
  Firebase.prototype.child = jasmine.createSpy('child').andReturn(new Firebase());
  Firebase.prototype.path = "/test";
  Firebase.prototype.limit = jasmine.createSpy('limit').andReturn(new Firebase());
  Firebase.prototype.name = jasmine.createSpy('name').andReturn('test');
  Firebase.prototype.on = jasmine.createSpy('on').andCallFake(function(event, callback) { firebaseEvents['on_' + event] = callback});
  Firebase.prototype.once = jasmine.createSpy('once').andCallFake(function(value, callback) { firebaseEvents['once'] = callback});
  Firebase.prototype.push = jasmine.createSpy('push').andReturn(new Firebase());
  Firebase.prototype.update = jasmine.createSpy('update').andCallFake(function(obj, callback) { callback() });
  Firebase.prototype.remove = jasmine.createSpy('remove');
  Firebase.prototype.set = jasmine.createSpy('set').andCallFake(function(bool, callback) { callback()});
  Firebase.prototype.ServerValue = {TIMESTAMP: {".sv": "timestamp"}};

  rootScope = {
    safeApply: jasmine.createSpy('safeApply').andCallFake(function(callback) { if (callback) {callback()}})
  }

  deferred = {
    resolve: jasmine.createSpy('resolve'),
    reject: jasmine.createSpy('reject'),
    promise: {
      then: function(callback) {
        callback();
      }
    }
  }

  q = {
    defer: function() {
      return deferred;
    }
  }

  firebase = new Firebase();

  beforeEach(module('firebaseResource'));

  beforeEach(function() {

    Bar = function(data) { angular.copy(data || {}, this) }
    Bar.getName = jasmine.createSpy('getName').andReturn('bars')
    Bar.all = jasmine.createSpy('all')
    Bar.new = jasmine.createSpy('new')

    module(function($provide) {
      $provide.value('firebase', firebase);
      $provide.value('Bar', Bar)
      $provide.value('$rootScope', rootScope)
      $provide.value('$q', q)
    });

    inject(function($injector) {
      firebaseResource = $injector.get('firebaseResource');
    });

  });

  describe('on initialization of a nested resource', function() {

    beforeEach(function() {

      firebase.child.reset();
      Model = firebaseResource(
        {
          path: 'foos',
          limit: 15,
          hasMany: ['Bar'],
          belongsTo: true
        }
      )

      resource = new Model({id: 1});

    });

    it('should implement getName()', function() {
      expect(Model.getName()).toBe("test")
    })

    it('should implement getPath()', function() {
      expect(Model.getPath()).toBe("/test");
    })

    it('should implement getPath()', function() {
      expect(Model.getPath()).toBe("/test");
    })

    it('should get all() from Bar within context of Foo', function() {
      resource.bars().all();
      expect(Bar.all).toHaveBeenCalledWith(
        { parent: jasmine.any(Object)
        })
    });


    describe('when calling all() on a nested resource', function() {
      beforeEach(function() {
        firebase.child.reset();
        firebase.on.reset();
        Firebase.prototype.name = function() { return 'bars' }
        Bar = firebaseResource({
          path: 'bars',
          limit: 15,
          belongsTo: true
        })

        Bar.query({ path: '/test/1/rels/bars/',
            parent: resource
          });

        snapshot = {
          name: function() { return "2"},
          val: function() {
            return this.data
          },
          data: {
            bing: 'bow',
            id: 2,
            bars_parent_id: 1
          }
        }

      })

      it('should set listeners with respect to parent association', function() {
        expect(firebase.child).toHaveBeenCalledWith('bars');
        expect(firebase.on.calls.length).toBe(3);
        expect(firebase.on.calls[0].args[0]).toBe('child_added', Function);
        expect(firebase.on.calls[1].args[0]).toBe('child_removed', Function);
        expect(firebase.on.calls[2].args[0]).toBe('child_changed', Function);
      });

      it('should add nested resource to parent resource on child_added event', function() {
        firebase.child.reset();
        firebaseEvents.on_child_added(snapshot);
        expect(firebase.child).toHaveBeenCalledWith('/test/2');
        expect(firebase.once).toHaveBeenCalledWith('value', jasmine.any(Function));
        firebaseEvents.once(snapshot);
        expect(resource._bars[0]).toBe(Bar.find(2))
        expect(Bar.find(2).bing).toEqual('bow');
        expect(Bar.find(2).id).toEqual('2');
        expect(Bar.find(2).bars_parent_id).toEqual(1);
      })

    })


    describe('an instantiation', function() {

      it('should allow instantiation from Bar within context of Foo', function() {
        var newBar = resource.bars().new({bing: 'bow'});
        expect(newBar).toEqual({
          bing: 'bow',
          _bars_parent_id: 1,
          _parent_path: '/test/1',
          _parent_rels_path : '/test/1/rels/bars/'
        })
      });

      it('should allow the adding of an existing resource to a parent', function() {
        var existingBar = new Bar({id: 2, bing: 'bow'});
        resource.bars().add(existingBar);
        expect(firebase.child).toHaveBeenCalledWith('foos')
      })



    });

  });

  describe('on initialization of a standalone resource', function() {

    beforeEach(function() {
      Firebase.prototype.name = function() { return 'foos' }
      firebase.on.reset();
      Model = firebaseResource(
        {
          path: 'foos',
          limit: 15
        }
      )

      snapshot = {
        name: function() { return "1"},
        val: function() {
          return this.data
        },
        data: {
          foo: 'bar',
          id: 1
        }
      }


    });

    it('should set listeners', function() {
      expect(firebase.child).toHaveBeenCalledWith('foos');
      expect(firebase.on.calls.length).toBe(3);
      expect(firebase.on.calls[0].args[0]).toBe('child_added', Function);
      expect(firebase.on.calls[1].args[0]).toBe('child_removed', Function);
      expect(firebase.on.calls[2].args[0]).toBe('child_changed', Function);
    })

    it('should add a resource on child_added event', function() {
      expect(Model.all().length).toBe(0);
      firebaseEvents.on_child_added(snapshot);
      expect(Model.all().length).toBe(1);
    })

    it('should update a resource on child_changed event', function() {
      firebaseEvents.on_child_added(snapshot);
      expect(Model.find(1).foo).toBe('bar');
      snapshot.data.foo = "baz";
      firebaseEvents.on_child_changed(snapshot);
      expect(Model.find(1).foo).toBe('baz');
      expect(Model.all().length).toBe(1);
    })

    it('should remove a resource on child_removed event', function() {
      firebaseEvents.on_child_added(snapshot);
      expect(Model.all().length).toBe(1);
      firebaseEvents.on_child_removed(snapshot);
      expect(Model.all().length).toBe(0);
    })

    it('should find a resource asynchronously', function() {
      var ref = Model.findAsync(1);
      expect(Model.find(1)).toBe(undefined);
      expect(firebase.once).toHaveBeenCalled();
      expect(ref.then).toEqual(jasmine.any(Function));
      firebaseEvents.once(snapshot);
      expect(Model.find(1).foo).toBe('bar');

      firebase.once.reset();
      firebaseEvents.on_child_added(snapshot);
      Model.findAsync(1);
      expect(firebase.once).not.toHaveBeenCalled();
      expect(Model.find(1).foo).toBe('bar');
    })

    describe('an instantiation', function() {

      beforeEach(function() {
        resource = {
          foo: 'bar',
          fun: angular.noop,
          _local: 'value'
        }
        instance = new Model(resource);
      })

      it('should contain any data passed in', function () {
        expect(instance.foo).toBe('bar');
      })

      it('should contain any data passed in', function () {
        expect(instance.foo).toBe('bar');
      })

      it('should respond to getName()', function () {
        expect(instance.getName()).toBe('foos');
      })

      it('should be saveable', function () {

        expect(instance.id).toBe(undefined);
        expect(instance.created_at).toBe(undefined)
        instance.afterCreate = jasmine.createSpy('afterCreate');
        instance.beforeSave = jasmine.createSpy('beforeSave');

        instance.save();
        expect(firebase.update).toHaveBeenCalledWith(
          {
            foo: 'bar',
            created_at: instance.created_at,
            updated_at: instance.updated_at,
          },
          jasmine.any(Function)
        );
        expect(instance.created_at).not.toBe(undefined);
        expect(instance.updated_at).not.toBe(undefined);
        expect(instance.afterCreate).toHaveBeenCalled();
        expect(instance.beforeSave).toHaveBeenCalled();
        expect(instance.id).toBe('foos');
        expect(deferred.resolve).toHaveBeenCalled();
        deferred.resolve.reset();
      });

      it('should be deletable', function() {
        instance.save();
        instance.delete();
        expect(firebase.remove).toHaveBeenCalled();
      });


      it('should respond to getTimestamp() and return adjusted time', function() {
        var created_at = Date.now();
        instance.created_at = created_at
        expect(instance.getTimestamp('created_at')).toEqual(created_at)
      })

    });

  });


});