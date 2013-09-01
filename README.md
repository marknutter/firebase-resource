firebase-resource
=================

Angular wrapper for Firebase in the style of ng-resource and active-record. 

*this is a very early release so please report any strangeness or suggestions*

#### Features

* Encapsulates Firebase to prevent dependency in controllers. Designed to be a drop-in replacement for ng-resource.
* Handles associations using foreign-key references, following the tactics outlined [here](https://www.firebase.com/blog/2013-04-12-denormalizing-is-normal.html)
* Automatically timestamps objects when saving and updating
* Handles pagination
* Stores resources in memory to prevent having to request data from Firebase as often
* Allows assigning of local attributes. Any attribute with a leading underscore will *not* be persisted to Firebase

planned features
* Store resources in localStorage or indexedDB
* Advanced querying options including searching
* Remove reliance on Firebase and make it compatible with any realtime backend

####Getting Started
Include firebase-resource.js in your index.html file. Suggest creating a services folder.

    <script src="/services/firebase_resource.js"></script>
    
firebase-resource requires a firebase module be injected into it. So define one thusly somewhere in your project:

    angular.module('exampleFirebase', []).
        value('firebase', (new Firebase('https://example.firebaseio.com/')));
        
firebase-resource relies on the existence of a safeApply method on $rootScope. In one of your controllers, define safeApply:

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
    
firebase-resource assumes you are defining your models as separate modules, much like ng-resource assumes. 
Inject firebase-resource into your where you might otherwise inject ng-resource.

    angular.module('Post', ['firebaseResource']).
      factory('Post', function (firebaseResource) {

      });
      
Create a resource using the resource factory defined in firebase-resource (again, like you would using ng-resource).

    angular.module('Post', ['firebaseResource']).
      factory('Post', function (firebaseResource) {
      
        var Post = firebaseResource(
          {
            path: 'posts'
          }
        );
        
        return Post;
        
      });

Define options for the resource. These include

* path - this is the actual Firebase path of the resource in question. 
* hasMany - an array of associations. These are other models defined as firebase-resources.
* perPage - how many results are retrieved per page.
* limit - used to limit number of results coming back from a query. Redundant when using pagination.
* belongsTo - determines whether a resource is defined within the context of a parent resource.

Inject the resource into controllers where needed

    angular.module('PostsCtrl', []).
      controller('PostsCtrl', function($scope, Post) {
        
        $scope.posts = Post.query({page: 1});
        
      });

Defining and using associations:


    angular.module('User', ['firebaseResource']).
      factory('User', function (firebaseResource) {
      
        var User = firebaseResource(
          {
            path: 'users',
            hasMany: ['Post']
          }
        );
        
        return User;
        
      });
      
    angular.module('Post', ['firebaseResource']).
      factory('Post', function (firebaseResource) {
      
        var Post = firebaseResource(
          {
            path: 'posts',
            belongsTo: true,
            perPage: 10
          }
        );
        
        return Post;
        
      });
      
    angular.module('PostsCtrl', []).
      controller('PostsCtrl', function($scope, Post, User) {
        
        $scope.user = User.query()[0];
        $scope.posts = $scope.user.posts().query({page: 1});
        
      });
      
      
Creating content in context of an assocation:

    var post = user.posts().new({content: 'hello world!'});
    post.save().
    then(function() {
      // do something
     })
     
Define lifecycle callbacks within the model definition:


    angular.module('Post', ['firebaseResource']).
      factory('Post', function (firebaseResource) {
      
        var Post = firebaseResource(
          {
            path: 'posts',
          }
        );
        
        Post.prototype.init = function(error) {
            // happens when model is instantiated from Firebase data
        };
        
        Post.prototype.afterCreate = function(error) {
            // happens only the first time an object is added to Firebase
        };
        
        Post.prototype.beforeSave = function(error) {
            // happens immediately before saving data to Firebase
        };
        
        Post.prototype.afterSave = function(error) {
            // happens after data is written to Firebase
        };
        
        return Post;
        
      });
      
      
Instance Methods:

* save() // saves resource to Firebase and returns a promise that is resolved upon success
* delete() // delets resource from local stores and Firebase. Returns a promise that is resolved on success
* getTimestamp(attr) // returns a javascript date of the provided timestamp. Accepts "created_at" or "updated_at"

Class Methods:

* getName() // returns the result of the firebase name() function
* getPath() // returns the result of the firebase path() function
* clearAll() // clears all resources out of memory
* find(id) // returns a resource from memory for a given id, but will not go to Firebase for it
* findAsync(id) // returns a resource from memory if available or Firebase if not. Returns a promise.
* all() // returns all resources in memory. options include limit and parent.
* query() // establishes firebase listeners for the resource given a set of options and stores results in resource stores.
