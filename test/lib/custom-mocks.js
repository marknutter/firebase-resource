
customMocks = {

  rootScope: {
    safeApply: jasmine.createSpy('safeApply').andCallFake(function(callback) { if (callback) {callback()}})
  },

  deferred: {
    resolve: jasmine.createSpy('resolve'),
    reject: jasmine.createSpy('reject'),
    promise: {
      then: function(callback) {
        callback();
      }
    }
  },

  q: {
    defer: function() {
      return customMocks.deferred;
    }
  },

  Firebase: {
    new: (new Firebase()),
    mockSnapshot: {}
  }

}


function Firebase() {};
Firebase.prototype.child = jasmine.createSpy('child').andReturn(new Firebase());
Firebase.prototype.path = "/test";
Firebase.prototype.limit = jasmine.createSpy('limit').andReturn(new Firebase());
Firebase.prototype.name = jasmine.createSpy('name').andReturn('test');
Firebase.prototype.on = jasmine.createSpy('on').andCallFake(function(event, callback) { customMocks.Firebase['on_' + event] = callback});
Firebase.prototype.once = jasmine.createSpy('once').andCallFake(function(value, callback) { customMocks.Firebase['once'] = callback});
Firebase.prototype.push = jasmine.createSpy('push').andReturn(new Firebase());
Firebase.prototype.update = jasmine.createSpy('update').andCallFake(function(obj, callback) { callback() });
Firebase.prototype.remove = jasmine.createSpy('remove');
Firebase.prototype.set = jasmine.createSpy('set').andCallFake(function(bool, callback) { callback()});
Firebase.ServerValue = {TIMESTAMP: {".sv": "timestamp"}};


