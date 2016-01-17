
function sortDecr(obj){
        var sortable = [];
        for (var lang in obj)
            sortable.push([lang, obj[lang]]);
        sortable.sort(function(a, b) {return -(a[1] - b[1])});
        return sortable;
    };

angular.module('HashStats', ['ngRoute', 'chart.js']);

angular.module('HashStats')

.run(function($rootScope, $http) {
    $rootScope.fileContent = 'no file';
    $rootScope.configInfo = 'no config';
    var configLocation = location.origin + location.pathname;
    configLocation = configLocation.substring(0, configLocation.lastIndexOf('/'));
    $http.get(configLocation+'/stats/configinfo.php').then(function(data) {
        $rootScope.configInfo = data.data;
    }, function(error){
        $rootScope.configInfo = 'error';
    });
})

    
//routing
.config(function ($routeProvider) {
    $routeProvider
        .when('/form', {
          controller: 'FormController',
          templateUrl: 'pages/form.html' 
        })
        .when('/loading', { 
          controller: 'LoadController', 
          templateUrl: 'pages/load.html' 
        })
        .when('/home', { 
          controller: 'HomeController', 
          templateUrl: 'pages/home.html' 
        })
        .when('/tweets/:keyword/:page', { 
          controller: 'TweetsController', 
          templateUrl: 'pages/tweets.html' 
        })
        .when('/sentiment', { 
          controller: 'SentimentController', 
          templateUrl: 'pages/sentiment.html' 
        })
        .when('/wordcount', { 
          controller: 'WordController', 
          templateUrl: 'pages/wordcount.html' 
        })
        .when('/lang', { 
          controller: 'LangController', 
          templateUrl: 'pages/lang.html' 
        })
        .when('/savepdf', { 
          controller: 'PDFController', 
          templateUrl: 'pages/savepdf.html' 
        })
        .otherwise({ 
          redirectTo: '/home' 
        }); 
})
;

//controllers    
angular.module('HashStats')

.controller('FormController', ['$scope', '$http', '$rootScope', '$location', function ($scope, $http, $rootScope, $location) {
    //var getContent = function(filename){ return $http.get('sample.json'); };
    var getContent = function(keyword){
        var location = window.location.href.substring(0, window.location.href.lastIndexOf('#'));
        return $http.get(location+'/stats/stats.php?keyword='+encodeURIComponent(keyword)); 
    };
    
    $scope.error = '';
    $scope.configInfo = function() { return $rootScope.configInfo; };
    
    $scope.$watch('configInfo()', function() {
        if ( $scope.configInfo() === 'error' ) { $scope.error = 'configinfo loading error'; }
    });
    
    $scope.keyword = '';
    $scope.submit = function() {
        $rootScope.fileContent = 'no file'; //reset for no early redirect in LoadController
        getContent($scope.keyword).then(
            function(data) { 
                $rootScope.fileContent = data.data; 
            }, 
            function(error){ 
                $rootScope.fileContent = 'error';
            }
        );
        $scope.filecontent = function() { return $rootScope.fileContent; }
        $location.path('/loading');
    };
}])

.controller('LoadController', ['$scope', '$rootScope', '$location', '$interval', function ($scope, $rootScope, $location, $interval) {
    
    $scope.filecontent = function() { return $rootScope.fileContent; }
    $scope.configInfo = function() { return $rootScope.configInfo; }
    
    $scope.$watch('configInfo()', function() {
        if (typeof $scope.configInfo() !== 'string') {
            $scope.estimatedTime = $scope.configInfo().estimatedtime;
            $scope.valueNow = 0;
            $scope.timeLeft = $scope.estimatedTime;
            $interval(function() { $scope.valueNow++; }, ($scope.estimatedTime*1000)/100 , 100);
            $interval(function() { $scope.timeLeft--; }, 1000 , $scope.estimatedTime);
        }
    });
    
    $scope.$watch('filecontent()', function () {
        if ($scope.filecontent() != 'no file') {
          $location.path('/home');
        }
    }); 
}])

.controller('HomeController', ['$scope', '$rootScope', function ($scope, $rootScope) {
    $scope.filecontent = function() { return $rootScope.fileContent; }
    $scope.error = '';
    if ( $scope.filecontent() === 'error' ) { $scope.error = 'stats loading error'; }
}])

.controller('TweetsController', ['$scope', '$rootScope', '$routeParams', '$filter', function ($scope, $rootScope, $routeParams, $filter) {
    $scope.filecontent = function() { return $rootScope.fileContent; }
    var filterKeyword = $routeParams.keyword;
    var numberOfTweets;
    if ( $scope.filecontent() != 'no file') 
        numberOfTweets = parseInt($scope.filecontent().meta.numtweets);
    $scope.currentPage = $routeParams.page;
    var tweets = $scope.filecontent().tweets;
    var tweetsPerPage = 10;
    var startTweet = ($scope.currentPage - 1) * tweetsPerPage;
    var endTweet = $scope.currentPage * tweetsPerPage;
    var filteredTweets;
    
    $scope.$watch('filterKeyword', function()
    { 
        if ( filterKeyword == 'all') {
            filteredTweets = tweets;
            $scope.tweetsIntro = 'Number of tweets: ' + $scope.filecontent().meta.numtweets + '.';
        }
        else {
            filteredTweets = $filter('filter')(tweets, {3:filterKeyword});
            $scope.tweetsIntro = 'Filtered by keyword: ' + filterKeyword + '.';
        }
        $scope.tweetsOnCurrentPage = filteredTweets.slice(startTweet, endTweet);
        pageNumber = Math.ceil( filteredTweets.length / tweetsPerPage );
        var previousPage, nextPage;
        if ( $scope.currentPage != 1 ) previousPage = parseInt($scope.currentPage)-1; else previousPage = 1;
        if ( $scope.currentPage != pageNumber ) nextPage = parseInt($scope.currentPage)+1; else nextPage = pageNumber;
        $scope.firstLink = '#/tweets/' + filterKeyword + '/1';
        $scope.lastLink = '#/tweets/' + filterKeyword + '/' + pageNumber;
        $scope.previousLink = '#/tweets/' + filterKeyword + '/' + previousPage;
        $scope.nextLink = '#/tweets/' + filterKeyword + '/' + nextPage;

        if ( $scope.currentPage == 1 ) $scope.firstClass = 'disabled'; else $scope.firstClass = '';
        if ( $scope.currentPage == 1 ) $scope.previousClass = 'disabled'; else $scope.previousClass = '';
        if ( $scope.currentPage == pageNumber ) $scope.nextClass = 'disabled'; else $scope.nextClass = '';
        if ( $scope.currentPage == pageNumber ) $scope.lastClass = 'disabled'; else $scope.lastClass = '';
    });
}])

.controller('WordController', ['$scope', '$rootScope', function ($scope, $rootScope) {
    $scope.filecontent = function() { return $rootScope.fileContent; }
   
    $scope.hidebuttonText = 'Hide';
    $scope.hidebuttonClass = 'btn btn-success active';
    $scope.formobj = {
        hideKeyword: false
    };

    if (typeof $scope.filecontent() !== 'string') {
        $scope.words = JSON.parse(JSON.stringify($scope.filecontent().word_count));
        $scope.mainkeyword = $scope.filecontent().meta.keyword;
        $scope.mainvalue = $scope.words[$scope.mainkeyword];  
        $scope.$watch('formobj.hideKeyword', function () {
            if ($scope.formobj.hideKeyword == true) {
                $scope.hidebuttonText = 'Show';
                $scope.hidebuttonClass = 'btn btn-info btn-xs active';
                delete $scope.words[$scope.mainkeyword]; 
                $scope.max = Math.max.apply(null, Object.keys($scope.words).map(function(key) { return $scope.words[key]; }));
            } else {
                $scope.hidebuttonText = 'Hide';
                $scope.hidebuttonClass = 'btn btn-success btn-xs';
                if ( typeof($scope.mainvalue) !== 'undefined' ) $scope.words[$scope.mainkeyword] = $scope.mainvalue;
                $scope.max = Math.max.apply(null, Object.keys($scope.words).map(function(key) { return $scope.words[key]; }));
            }
        }); 
    }
}])

.controller('SentimentController', ['$scope', '$rootScope', function ($scope, $rootScope) {

    $scope.filecontent = function() { return $rootScope.fileContent; }
    
    $scope.sentimentPercent = [];
    $scope.labels = [];
    $scope.sentcount = [];
    $scope.colours = ['#8DB600','#FDB600','#DC143C','#907B3B'];
    $scope.options = {
      'animation' : false,
    };

    if (typeof $scope.filecontent() !== 'string') { 
        $scope.sentimentPercent["positive"] = Math.round(($scope.filecontent().sentiment.positive*100)/$scope.filecontent().meta.numtweets);
        $scope.sentimentPercent["neutral"] = Math.round(($scope.filecontent().sentiment.neutral*100)/$scope.filecontent().meta.numtweets);
        $scope.sentimentPercent["negative"] = Math.round(($scope.filecontent().sentiment.negative*100)/$scope.filecontent().meta.numtweets);
        $scope.sentimentPercent["undef"] = Math.round(($scope.filecontent().sentiment.undefined*100)/$scope.filecontent().meta.numtweets);
        $scope.labels = Object.keys($scope.filecontent().sentiment);
        $scope.sentcount = Object.keys($scope.filecontent().sentiment).map(function (key) {return $scope.filecontent().sentiment[key]});
    };

}])

.controller('LangController',['$scope', '$rootScope', function ($scope, $rootScope) {
    $scope.filecontent = function() { return $rootScope.fileContent; }

    $scope.colours = ['#8DB600','#FDB600','#DC143C','#907B3B'];
    $scope.options = {
      'animation' : false,
      'responsive': true,
      'maintainAspectRatio': false
    };
    $scope.labels = [];
    $scope.langcount = [];
    $scope.langonce = '';

    if (typeof $scope.filecontent() !== 'string') {
        
        $scope.lang = sortDecr($scope.filecontent().lang);

        for (var i = 0; i < $scope.lang.length; i++) {
            if ($scope.lang[i][1] <= 1) { $scope.langonce = $scope.langonce + $scope.lang[i][0] + ', ';  continue; }
            $scope.labels.push($scope.lang[i][0]);
            $scope.langcount.push($scope.lang[i][1]);
        }
        
        if ( $scope.langonce === '' ) { $scope.langonce = 'non'; }

        $scope.langcount = [$scope.langcount];
    }
}])

.controller('PDFController',['$scope', '$rootScope', function ($scope, $rootScope) {
    $scope.filecontent = function() { return $rootScope.fileContent; }
    if (typeof $scope.filecontent() !== 'string') {
        $scope.created = createPDF($scope.filecontent());
    }
}]);

//directives
angular.module('HashStats')

.directive('tweet', function(){
    return{
      restrict: 'E',
    scope: {
        info: '='
    },
    templateUrl: 'pages/tweet.html'
  };
});