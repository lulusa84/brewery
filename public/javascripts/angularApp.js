var app = angular.module('flapperNews', ['ui.router']);
// var app = angular.module('brewery', [ ui.router']]);
app.config(['$stateProvider','$urlRouterProvider', function($stateProvider, $urlRouterProvider){
  $stateProvider.state('home',{
    url: '/home',
        templateUrl: '/home.html',
        controller: 'MainCtrl',
        resolve: {
        postPromise: ['posts', function(posts){
        // postPromise: ['beers', function(beers){
         
        return posts.getAll();
        //return beers.getAll
    }]
    }
  });

  $stateProvider.state('posts', {
    // $stateProvider.state('beers', {
    url: '/posts/{id}',
    templateUrl: '/posts.html',
    controller: 'PostsCtrl',
    resolve: {
    post: ['$stateParams','posts', function($stateParams, posts) {
    return posts.get($stateParams.id);
    }]
    }
  });

  $stateProvider.state('login', {
  url: '/login',
  templateUrl: '/login.html',
  controller: 'AuthCtrl',
  onEnter: ['$state', 'auth', function($state, auth){
    if(auth.isLoggedIn()){
      $state.go('home');
    }
  }]
});

 $stateProvider.state('register', {
  url: '/register',
  templateUrl: '/register.html',
  controller: 'AuthCtrl',
  onEnter: ['$state', 'auth', function($state, auth){
    if(auth.isLoggedIn()){
      $state.go('home');
    }
  }]
});

  $urlRouterProvider.otherwise('home');
}]);

app.factory('auth', ['$http', '$window', function($http, $window){
   var auth = {};

auth.saveToken = function (token){
  $window.localStorage['flapper-news-token'] = token;
};

auth.getToken = function (){
  return $window.localStorage['flapper-news-token'];
};

auth.isLoggedIn = function(){
  var token = auth.getToken();

  if(token){
    var payload = JSON.parse($window.atob(token.split('.')[1]));

    return payload.exp > Date.now() / 1000;
  } else {
    return false;
  }
  };

auth.currentUser = function(){
  if(auth.isLoggedIn()){
    var token = auth.getToken();
    var payload = JSON.parse($window.atob(token.split('.')[1]));

    return payload.username;
  }
};
auth.register = function(user){
  return $http.post('/register', user)
  .success(function(data){
    auth.saveToken(data.token);
  });
};

auth.logIn = function(user){
  return $http.post('/login', user)
  .success(function(data){
    auth.saveToken(data.token);
  });
};

auth.logOut = function(){
  $window.localStorage.removeItem('flapper-news-token');
};

  return auth;
}])

//app.factory('posts', [function(){
app.factory('posts',['$http', 'auth',function($http,auth){
  //app.factory('beers', ['$http', 'auth',function($http,auth){
  var o = {
    posts: []
    };
  

o.getAll = function() {
    return $http.get('/posts')
    //return $http.get('/beers')
    .success(function(data){
      angular.copy(data, o.posts);
    });
  };

o.create = function(post) {
  return $http.post('/posts', post,{
   // return $http.post('/beers', post,{
  headers: {Authorization: 'Bearer '+ auth.getToken()}
  })
  .success(function(data){
    o.posts.push(data);
    //o.beers.push(data);
  });
};

o.upvote = function(post) {
  return $http.put('/posts/' + post._id + '/upvote', post,{ 
  // return $http.put('/beers/' + beers._id + '/upvote', beer,{ 
  headers: {Authorization: 'Bearer '+auth.getToken()}
  })
  .success(function(data){
      post.upvotes += 1;
  });
};

o.get = function(id) {
  return $http.get('/posts/' + id)
  //return $http.get('/beers/' + id)
  .then(function(res){
  return res.data;
  });
};

o.addComment = function(id, comment) {
  return $http.post('/posts/' + id + '/comments', comment, {
    //return $http.beer('/beer/' 
  headers: {Authorization: 'Bearer '+auth.getToken()}
});
};

o.upvoteComment = function(post, comment) {
  return $http.put('/posts/' + post._id + '/comments/'+ comment._id + '/upvote',null, {
    //return $http.put('/beers/' + beer._id 
    headers: {Authorization: 'Bearer '+auth.getToken()}
  })
  .success(function(data){
      comment.upvotes += 1;
    });
};
return o;
 
}]);
app.controller('MainCtrl', ['$scope', 'posts', 'auth',function($scope, posts,auth){
  
  $scope.posts = posts.posts;
  $scope.isLoggedIn = auth.isLoggedIn;

  $scope.addPost = function(){
      if(!$scope.title || $scope.title === '') { return; }
      /*
      $scope.posts.push({
        title: $scope.title,
        link: $scope.link,
        upvotes: 0,
      comments: [
        {author: 'Joe', body: 'Cool post!', upvotes: 0},
        {author: 'Bob', body: 'Great idea but everything is wrong!', upvotes: 0}
      ]
      */
      posts.create({
      title: $scope.title,
      name:  $scope.name,
      link:  $scope.link,
      ABV:   $scope.ABV,
      IBU:   $scope.IBU,
      author: 'user',
      });

      $scope.title = '';
      $scope.link = '';
      $scope.ABV = '';
      $scope.IBU = '';
  };
  /*
  $scope.incrementUpvotes = function(post) {
      post.upvotes += 1;
  };
*/
$scope.incrementUpvotes = function(post) {
  posts.upvote(post);
  

};

}]);//app.controller MainCtrl

app.controller('PostsCtrl', ['$scope','posts','post','auth',function($scope, posts, post,auth){

  $scope.post = post;
  $scope.isLoggedIn = auth.isLoggedIn;

  $scope.addComment = function(){
    if($scope.body === '') { return; }

    posts.addComment(post._id, {
    body: $scope.body,
    author: 'user',
    })
    .success(function(comment) {
      $scope.post.comments.push(comment);
      //body: $scope.body,
      //author: $scope.author,
      //upvotes: 0
    });
    $scope.body = '';
    //$scope.author = '';
    };

$scope.incrementUpvotes = function(comment){
posts.upvoteComment(post, comment);

};

}]);//post.controller PostCtrl

app.controller('AuthCtrl', ['$scope','$state','auth',function($scope, $state, auth){
  $scope.user = {};

  $scope.register = function(){
    auth.register($scope.user).error(function(error){
      $scope.error = error;
    }).then(function(){
      $state.go('home');
    });
  };

  $scope.logIn = function(){
    auth.logIn($scope.user).error(function(error){
      $scope.error = error;
    }).then(function(){
      $state.go('home');
    });
  };
}])//auth.controller AuthCtrl

app.controller('NavCtrl', ['$scope','auth',function($scope, auth){
  $scope.isLoggedIn = auth.isLoggedIn;
  $scope.currentUser = auth.currentUser;
  $scope.logOut = auth.logOut;

}]);//nav.controller NavCtrl



