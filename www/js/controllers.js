angular.module('todo.controllers', [])

.controller('todoCtrl', function($scope, $rootScope, $ionicModal, Projects, TempImages, TempPlaces, TempProjects, 
$ionicSideMenuDelegate, $timeout, $ionicPopup, $filter, $ionicActionSheet, $ionicLoading, 
$cordovaSocialSharing, $ionicScrollDelegate, $cordovaCamera, $ionicBackdrop, $ionicSlideBoxDelegate, 
$cordovaFile, $ionicPlatform, $cordovaFileTransfer, $http, $cordovaToast, $cordovaContacts, $state, 
ionicDatePicker, ionicTimePicker, $cordovaLocalNotification, $cordovaCapture, $interval, $cordovaDialogs,
$ionicTabsDelegate, $cordovaGeolocation, $cordovaAppVersion, $cordovaTouchID, $cordovaClipboard) {

  $scope.zoomMin = 1;
  $scope.currentPlatform = ionic.Platform.platform();
  $scope.awsLink = "http://lowcost-env.gyqn3pie8x.us-west-2.elasticbeanstalk.com/";
  $scope.localhostLink = "http://localhost:80/";
  var backbutton=0;
  var month = new Array();
    month[0] = "January";
    month[1] = "February";
    month[2] = "March";
    month[3] = "April";
    month[4] = "May";
    month[5] = "June";
    month[6] = "July";
    month[7] = "August";
    month[8] = "September";
    month[9] = "October";
    month[10] = "November";
    month[11] = "December";

  function addZero(i) {
      if (i < 10) {
          i = "0" + i;
      }
      return i;
  }

  function formatTime(the24Hour, theMinute) {
      if (the24Hour>12)
      {
        theHour = addZero(the24Hour - 12)
        theAMPM = "PM"
      }
      else if (the24Hour == 12)
      {
        theHour = the24Hour
        theAMPM = "PM"        
      }
      else
      {
        theHour = the24Hour
        theAMPM = "AM"
      }
      return theHour + ':' + theMinute + ':' + '00 ' + theAMPM;
  }   

  function arrayContainsString(array, string) {
    var newArr = array.filter(function(el) {
      return el === string;
    });
    return newArr.length > 0;
  }

  $scope.getTweetStatus = function(tweetLink) {
    $scope.externalTempImage = [];
    $scope.imageCount = 0
    // tweetLink = "https://twitter.com/appneedme/status/796711554226016256"
    $scope.baseLink = $scope.localhostLink
    if ($scope.currentPlatform == "android" || $scope.currentPlatform == "ios") $scope.baseLink = $scope.awsLink
    $ionicLoading.show({
      template: '<ion-spinner></ion-spinner>' + 'Fetching ... '
    });
    console.log($scope.baseLink + "tweet_content.php?copylink=" + tweetLink)
    $http.get($scope.baseLink + "tweet_content.php?copylink=" + tweetLink, { timeout: 3000 })
    .success(function (tweetJson) {
      if (tweetJson[0].description == undefined)
      {
        $scope.intentMessage = null
        $scope.twitterDetected = false
        $ionicLoading.hide();
        if ($scope.currentPlatform == "android" || $scope.currentPlatform == "ios") $cordovaToast.showShortCenter('No data found')
        return       
      }
      if (tweetLink.includes("instagram.com")) tweetJson[0].description = ""
      $scope.task.title = $scope.task.title + ' ' + tweetJson[0].description
      $scope.task.title = $scope.task.title.replace(tweetLink,'').replace(/[“”]/g,'').trim();
      if (tweetJson[0].images)
      {
        for (var i = 0; i < tweetJson[0].images.length; i++) {
          console.log(tweetJson[0].images[i])
          var myFileName = Math.floor(Date.now());
          var pathToFolder = "";
          if ($scope.currentPlatform == "android") {
            pathToFolder = cordova.file.externalDataDirectory;
          }
          else if ($scope.currentPlatform == "ios") {
            pathToFolder = cordova.file.applicationStorageDirectory + "Library/Cloud/"
          }

          $cordovaFileTransfer.download(tweetJson[0].images[i], pathToFolder + myFileName + '.jpg', { timeout: 3000 }, true).then(
          function(fileEntry)
            {
              var newimageData;
              if ($scope.currentPlatform == "android") newimageData = fileEntry.nativeURL;
              if ($scope.currentPlatform == "ios") newimageData = "Library/Cloud/" + myFileName + ".jpg";
              console.log(newimageData)
              var newTempImage = TempImages.newTempImage(newimageData);
              $scope.tempimages.push(newTempImage);
              $scope.tempimages = sortByKey($scope.tempimages, 'imageURI');
              TempImages.save($scope.tempimages);
              console.log(Projects.getLastActiveModal())
              if (Projects.getLastActiveModal() == 'editTaskModal')
              {
                $scope.updateTask($scope.activeTask);
              }
              $scope.imageCount = $scope.imageCount + 1
              console.log($scope.imageCount)
              if (tweetJson[0].images.length == $scope.imageCount) 
                {
                  if ($scope.twitterDetected == true)
                  {
                    console.log("in")
                    $scope.selectProject($scope.myLastActiveIndex)
                    $scope.createTask($scope.task)
                    $scope.intentMessage = null
                    $scope.closeProjects();
                    $scope.getTabIndex();
                    $scope.twitterDetected = false
                  }
                  $ionicLoading.hide();
                }
            },
            function (error)
              {
                console.log(error);
                $ionicLoading.hide();
                TempImages.clear()
                $scope.intentMessage = null
                $scope.twitterDetected = false
                if ($scope.currentPlatform == "android" || $scope.currentPlatform == "ios") $cordovaToast.showShortCenter('Image download too slow. Aborted')        
              }
            );
        }
      }
    })
    .catch(function(error) {
      // Catch and handle exceptions from success/error/finally functions
      console.log(error);
      TempImages.clear()
      $scope.intentMessage = null
      $scope.twitterDetected = false
      $ionicLoading.hide();
      if ($scope.currentPlatform == "android" || $scope.currentPlatform == "ios") $cordovaToast.showShortCenter('Ensure good connection speed')        
    });
  }

  function sortByKey(array, key) {
      return array.sort(function(a, b) {
          var x = a[key]; var y = b[key];
          return ((x < y) ? -1 : ((x > y) ? 1 : 0));
      });
  }

  function isTwitterLink(text)
  {
    var source = (text || '').toString();
    var urlArray = [];
    var url;
    var matchArray;
    var regexToken = /(((ftp|https?):\/\/)[\-\w@:%_\+.~#?,&\/\/=]+)|((mailto:)?[_.\w-]+@([\w][\w\-]+\.)+[a-zA-Z]{2,3})/g;
    while( (matchArray = regexToken.exec( source )) !== null )
    {
      var token = matchArray[0];
      pathArray = token.split( '/' );
      if (pathArray[2] == "twitter.com")
      {
        return token;
      }
    }
    return false;
  }

  function findUrls(text)
  {
    var source = (text || '').toString();
    var urlArray = [];
    var url;
    var matchArray;
    var regexToken = /(((ftp|https?):\/\/)[\-\w@:%_\+.~#?,&\/\/=]+)|((mailto:)?[_.\w-]+@([\w][\w\-]+\.)+[a-zA-Z]{2,3})/g;
    while( (matchArray = regexToken.exec( source )) !== null )
    {
      var token = matchArray[0];
      pathArray = token.split( '/' );
      if (pathArray[2] == "twitter.com" || pathArray[2].includes("instagram.com"))
      {
        $scope.getTweetStatus(token)
      }
      else
      {
        urlArray.push({
          clickableLink: token,
          baseURL: pathArray[2]
        });
      }
    }

    return urlArray;
  }

  function findGPS(text)
  {
    var source = (text || '').toString();
    var gpsArray = [];
    var matchArray;
    var geoCode;
    var regexToken = /([-+]?)([\d]{1,2})(((\.)(\d+)(,)))(\s*)(([-+]?)([\d]{1,3})((\.)(\d+))?)/g
    while( (matchArray = regexToken.exec( source )) !== null )
    {
        var token = matchArray[0];
        googleLocationFormat = matchArray[0].replace(/,+/g, '+')
        googleLocationFormat = 'http://maps.google.com/maps?z=17&t=m&q=loc:' + googleLocationFormat
        gpsArray.push({
          gpsLink: googleLocationFormat,
          gpsAddress: token
        });
    }
    return gpsArray;
  }

  // var phoneno = /^\+?([0-9]{2})\)?[-. ]?([0-9]{4})[-. ]?([0-9]{4})$/;
  // if(inputtxt.value.match(phoneno)) {
  //   return true;
  // } 

  function developSuggestion()
  {
    // $timeout(function()
    //   {
    //     if ($scope.activeProject.tasks.length <= 0)
    //     $scope.suggestionMessage = "Add a new note"; 
    //     // console.log($scope.firstProject)
    //   },2000);
  }

  $scope.placeholderFunction = function () {
    if ($scope.currentPlatform == "android" || $scope.currentPlatform == "ios") $cordovaToast.showShortCenter('Function will be available soon')        
  } 

  $scope.saveIntentTask = function(index, intentMessage) {
    if (isTwitterLink(intentMessage))
    {
      $scope.task = {}
      $scope.twitterDetected = true
      $scope.task.title = isTwitterLink(intentMessage)
      $scope.myLastActiveIndex = index
      findUrls(intentMessage)
      // $scope.twitterDetected = false
      console.log("twitter detected")
    }
    else
    {
      var task = 
      {
        title: intentMessage,     
        dueDate: null,
        dueTime: null
      }
      $scope.selectProject(index)
      $scope.task = task
      $scope.createTask($scope.task)
      $scope.intentMessage = null
      $scope.closeProjects();
      $scope.getTabIndex();
    }
  }

  document.addEventListener('deviceready', function () {
    $scope.currentPlatform = ionic.Platform.platform(); 
    // ionic.Platform.fullScreen();
    $scope.projects = Projects.all();
    $scope.enablebackground = Projects.getEnableBackground();
    // $scope.getProjectTemplates()
    $scope.upcomingList = [];
    if ($scope.currentPlatform == "android" || $scope.currentPlatform == "ios") $scope.getUpcomingEvents();
    $scope.uuidPath = cordova.file.applicationStorageDirectory

    if ($scope.currentPlatform == "android")
    {
      window.plugins.intent.setNewIntentHandler(function (intent) {
        console.log(intent)
        if (intent.extras && intent.extras['android.intent.extra.TEXT'])
        {
          var intentMsg = ((intent.extras['android.intent.extra.SUBJECT'] || '') + ' ' + (intent.extras['android.intent.extra.TEXT'] || '')).trim()
          $scope.intentMessage = intentMsg
          $scope.projectsModal.show()
        }
      });

      window.plugins.intent.getCordovaIntent(function (intent) {
        console.log(intent)
        if (intent.extras && intent.extras['android.intent.extra.TEXT'])
        {
          var intentMsg = ((intent.extras['android.intent.extra.SUBJECT'] || '') + ' ' + (intent.extras['android.intent.extra.TEXT'] || '')).trim()
          $scope.intentMessage = intentMsg
          $scope.projectsModal.show()          
        }
      }, 
      function () {}
      );
    }

    cordova.getAppVersion.getVersionNumber().then(function (build) {
      $scope.appBuild = build;
      $http.get("https://jsonblob.com/api/jsonBlob/580de161e4b0bcac9f83a2da")
      .success(function (internet) {
        console.log(internet)
        if ($scope.currentPlatform == "android" && $scope.appBuild < internet.android_version)
        {
          $cordovaToast.showLongCenter("Update to the latest version now")
        }
        if ($scope.currentPlatform == "ios" && $scope.appBuild < internet.ios_version)
        {
          $cordovaToast.showLongCenter("Update to the latest version now") 
        }
      })
    });

    if ($scope.projects.length == 0 && Projects.getDefaultProject() == "false")
      {
        $scope.defaultProjects()
        Projects.setDefaultProject("true")
      }
    
    if ($scope.currentPlatform == "android")
    {
      if ($scope.enablebackground == "true")
        {
          cordova.plugins.backgroundMode.enable();
        }
      $scope.getNearestUpcoming()
    }

    if($scope.currentPlatform === "ios") window.plugin.notification.local.promptForPermission();
    cordova.plugins.notification.local.on("click", function (notification) 
    {
      myNotificationId = notification.id
      $scope.getTaskByTaskId(myNotificationId)
    })

    // temp fix. watch: https://github.com/katzer/cordova-plugin-local-notifications/pull/1093#issuecomment-247429360
    if (ionic.Platform.platform() === 'ios' && ionic.Platform.version() >= 8) {
      cordova.plugins.notification.local.on('trigger', function (notification) {
        if (!$rootScope.appInBackground) {
          console.log("test")
          $cordovaDialogs.confirm(notification.text, notification.title, ['OK','Cancel'])
            .then(function(buttonIndex) {
              // no button = 0, 'OK' = 1, 'Cancel' = 2
              var btnIndex = buttonIndex;
              if (btnIndex == 1) 
              {
                $scope.getTaskByTaskId(notification.id)
              }
            });
          $cordovaDialogs.beep(1);
        }
      });
    }  
  });

  document.addEventListener('touchstart', function (event) {
    if ($ionicSideMenuDelegate.isOpenLeft()) {
      event.preventDefault();
      //purpose: workaround for unable to close menu using swipe left. happens to android 4.4.2
    }
  });  

  document.addEventListener("pause", onPause, false);

  function onPause() {
    if ($scope.currentPlatform == "android" || $scope.currentPlatform == "ios")
    {
      if ($scope.enablebackground == "true")
        {
          cordova.plugins.backgroundMode.enable();
        }
      $scope.getNearestUpcoming()
    }
  }  

  document.addEventListener("resume", onResume, false);

  function onResume() {
    if ($scope.currentPlatform == "android" || $scope.currentPlatform == "ios")
    {
      $scope.getClipboardValue()
    }
  }  

  window.addEventListener("orientationchange", function(event) {
    switch(screen.orientation.angle) 
    {  
      case -90:
      case 90: break; // console.log('landscape');
      default: break; // console.log('portrait');
    }
  }, false);

  // Create and load the Modal
  $ionicModal.fromTemplateUrl('templates/new-task.html', function(modal) {
    $scope.taskModal = modal;
  }, {
    scope: $scope,
    animation: 'none',
    // hardwareBackButtonClose: false,
    // focusFirstInput: true,
    backdropClickToClose: false
  });
  $ionicModal.fromTemplateUrl('templates/edit-task.html', function(modal) {
    $scope.editTaskModal = modal;
  }, {
    scope: $scope,
    backdropClickToClose: false,
    animation: 'none'
  });
  $ionicModal.fromTemplateUrl('templates/new-project.html', function(modal) {
    $scope.newProjectModal = modal;
  }, {
    scope: $scope,
    backdropClickToClose: false,
    // focusFirstInput: true,
    animation: 'none'
  });  
  $ionicModal.fromTemplateUrl('templates/edit-setting.html', function(modal) {
    $scope.editSettingModal = modal;
  }, {
    scope: $scope,
    backdropClickToClose: false,
    animation: 'none'
  });  
  $ionicModal.fromTemplateUrl('templates/new-collaborator.html', function(modal) {
    $scope.newCollaboratorModal = modal;
  }, {
    scope: $scope,
    backdropClickToClose: false,
    animation: 'none'
  }); 
  $ionicModal.fromTemplateUrl('templates/search.html', function(modal) {
    $scope.searchModal = modal;
  }, {
    scope: $scope,
    backdropClickToClose: false,
    animation: 'none'
  });   
  $ionicModal.fromTemplateUrl('templates/places.html', function(modal) {
    $scope.placesModal = modal;
  }, {
    scope: $scope,
    backdropClickToClose: false,
    animation: 'none'
  });      

  $ionicModal.fromTemplateUrl('templates/calendar.html', function(modal) {
    $scope.calendarModal = modal;
  }, {
    scope: $scope,
    backdropClickToClose: false,
    animation: 'none'
  });  

  $ionicModal.fromTemplateUrl('templates/projects.html', function(modal) {
    $scope.projectsModal = modal;
  }, {
    scope: $scope,
    backdropClickToClose: false,
    animation: 'none'
  }); 

  $ionicModal.fromTemplateUrl('templates/gallery-zoomview.html', function(modal) {
    $scope.PopupImageModal = modal;
  }, {
    scope: $scope,
    backdropClickToClose: false,
    animation: 'none'
  }); 
  $ionicModal.fromTemplateUrl('templates/gallery-zoomview-temp.html', function(modal) {
    $scope.PopupTempImageModal = modal;
  }, {
    scope: $scope,
    backdropClickToClose: false,
    animation: 'none'
  }); 
  

  // Load or initialize projects
  $scope.projects = Projects.all();
  $scope.tempimages = TempImages.all();
  $scope.newitemistop = Projects.getNewItemIsTop();
  $scope.completehidden = Projects.getCompleteHidden();
  $scope.enablebackground = Projects.getEnableBackground();
  $scope.myLastActiveIndex = Projects.getLastActiveIndex();
  $scope.activeProject = $scope.projects[Projects.getLastActiveIndex()];
  $scope.firstProject = $scope.projects[0];
  $scope.propertiesStack = false;
  $scope.myLastActiveModal = Projects.getLastActiveModal();
  $scope.dateFilter = Projects.getAccomplishmentDays();
  $scope.upcomingFilter = Projects.getUpcomingDays();
  $scope.showTransferWindow = false;
  $scope.referrer = "";
  $scope.themeString = Projects.getThemeString();
  $scope.windowHeight = $(window).innerHeight();
  $scope.recognizedText = '';
  $scope.expandReminder = true;
  $scope.expandAccomplishment = false;
  developSuggestion();
  $scope.notDoneLimit = 0;
  $scope.doneLimit = 0;
  $scope.currentTabIndex = 0;
  $scope.downloadLink = "http://bit.ly/2edt2aI"
  // if ("0.1.23" < "0.1.22") console.log("yes")


  $scope.projects.length > 0 ? $scope.propertiesHidden = false : $scope.propertiesHidden = true

  $scope.getTabIndex = function()
  {
      console.log("benny")
      $scope.activeProject = $scope.projects[Projects.getLastActiveIndex()];
      $scope.currentTabIndex = $ionicTabsDelegate.selectedIndex();
      if ($scope.currentTabIndex == undefined) $scope.currentTabIndex = 0;
      console.log($scope.currentTabIndex)
      if ($scope.currentTabIndex == "1" && $scope.activeProject)
      {
        $scope.doneLimit = 0
        $scope.notDoneLimit = $scope.activeProject.tasks.length + 1
      }
      else if ($scope.currentTabIndex == "2" && $scope.activeProject)
      {
        $scope.doneLimit = $scope.activeProject.tasks.length + 1
        $scope.notDoneLimit = 0
      }
      else if ($scope.currentTabIndex == "3" && $scope.activeProject)
      {
        // $scope.getProjectTemplates()
      }
      else
      {
        $scope.doneLimit = 0
        $scope.notDoneLimit = 0
      }
      $ionicScrollDelegate.scrollTop();
  }    

  if ($scope.activeProject && $scope.activeProject.hasOwnProperty('category'))
  {
    $scope.activeProject.category == "subtotal" ? $scope.showSubTotal = true : $scope.showSubTotal = false;    
  }
  if (!$scope.myLastActiveIndex) $scope.myLastActiveIndex = Projects.getLastActiveIndex(); 

  $ionicPlatform.onHardwareBackButton(function(event) {  
    $scope.myLastActiveModal = Projects.getLastActiveModal();
    if ($scope.myLastActiveModal == 'taskModal') {
      if ($scope.task.title !== "" || $scope.tempimages.length > 0)
      {
        $scope.createTask($scope.task)
      }
      else
      {
        $scope.closeNewTask();
      }
    }
    if ($scope.myLastActiveModal == 'accomplishmentModal') {
      Projects.setLastActiveModal('');      
    }
    if ($scope.myLastActiveModal == 'searchModal') {
      $scope.closeSearch();
    }
    if ($scope.myLastActiveModal == 'upcomingModal') {
      Projects.setLastActiveModal('');  
    }  
    if ($scope.myLastActiveModal == 'placesModal') {
      Projects.setLastActiveModal('taskModal');
    } 
    if ($scope.myLastActiveModal == 'calendarModal') {
      Projects.setLastActiveModal('');  
    }
    if ($scope.myLastActiveModal == 'projectsModal') {
      Projects.setLastActiveModal('');  
    }       
    if ($scope.myLastActiveModal == 'editTaskModal') {
      $scope.setLastActiveModal = $scope.referrer;
      $scope.closeEditTask($scope.referrer);
      $scope.showTransferWindow = false;
    }
    if ($scope.myLastActiveModal == 'editTaskModal') {
      $scope.showTransferWindow = false;
    }    
    if ($scope.myLastActiveModal == 'newProjectModal') {
      if ($scope.projects.title !== "")
      {
        $scope.createCustomProject($scope.projects.title)
        $scope.showTemplateWindow = false;
      }
      else
      {
        $scope.closeNewProject();
      }
    }    
    if ($scope.myLastActiveModal == 'newCollaboratorModal') {      
      var input = $('input');
      input.val('');
      $scope.contacts = [];
    }    
  });


  $ionicPlatform.registerBackButtonAction(function() {
    if ($scope.currentPlatform == "android" || $scope.currentPlatform == "ios")
    {
      if(backbutton==0)
        {
          backbutton++;
          $ionicTabsDelegate.select(0);
          $cordovaToast.showLongCenter("Touch Back again to exit");
          $timeout(function(){backbutton=0;},2500);
        }
      else
        {   
          console.log($scope.enablebackground)
          if ($scope.enablebackground == "true")
          {
            cordova.plugins.backgroundMode.enable();
            $scope.getNearestUpcoming()
            window.plugins.appMinimize.minimize();        
          }
          else
          {
            cordova.plugins.backgroundMode.disable();
            ionic.Platform.exitApp();
          }
        }
    }
  }, 100);

  $scope.disableBackgroundMode = function() {
    cordova.plugins.backgroundMode.disable();
  }


  $scope.findTaskIndex = function(tasks, id) {
    for(var i=0;i<tasks.length;i++) {
      if (tasks[i].id == id) return i;
    }
    return -1;
  }  

  $scope.selectProject = function(index) {
    $scope.suggestionMessage = null;
    var previousActiveIndex = Projects.getLastActiveIndex()
    $scope.activeProject = $scope.projects[index];

    Projects.setLastActiveIndex(index);   
    $scope.myLastActiveIndex = index; 
    $scope.project = {title: $scope.projects[index].title, tasks: $scope.projects[index].tasks};

    if ($scope.activeProject.category == "subtotal")
    {
      $scope.showSubTotal = true;
    }
    else
    {
      $scope.showSubTotal = false;
    }
    $scope.hideMoreProperties();
    developSuggestion();

    $ionicTabsDelegate.select(1)
    $scope.notDoneLimit = 0
    $scope.doneLimit = 0

    $scope.getTabIndex()

  };

  // $scope.touchAuthentication = function (myLastActiveIndex, fromTabIndex) {
  //   $cordovaTouchID.checkSupport().then(function() {
  //     if ($scope.folderAuthenticated == false && (fromTabIndex == 0 || fromTabIndex == -1))
  //     {
  //       // success, TouchID supported 
  //       $cordovaTouchID.authenticate("Unlock with your fingerprint").then(function() {
  //         // successful authentication
  //         $scope.biometryLockedOut = false
  //         $scope.folderAuthenticated = true
  //         $scope.getTabIndex()
  //       }, function (errorCode) {
  //         // error authenticating
  //         if ($scope.currentPlatform == "android" || $scope.currentPlatform == "ios") $cordovaToast.showShortCenter(errorCode)  
  //         $ionicTabsDelegate.select(0)  
  //       });
  //     }
  //     else if ($scope.folderAuthenticated == true)
  //     {
  //       // do nothing
  //       $scope.getTabIndex()
  //     }
  //   }, function (error) {
  //     // TouchID not supported
  //     if (error == "Biometry is locked out.")
  //     {
  //       $scope.biometryLockedOut = true
  //       $ionicTabsDelegate.select(0)
  //       $scope.activeProject = $scope.projects[Projects.getLastActiveIndex()];
  //       $scope.currentTabIndex = $ionicTabsDelegate.selectedIndex();
  //       if ($scope.currentPlatform == "android" || $scope.currentPlatform == "ios") $cordovaToast.showShortCenter(error)
  //     }
  //     else
  //     {
  //       $scope.folderAuthenticated = true
        
  //     }
  //   });  
  // }

  $scope.swipeToNextTab = function (tabIndex) {
    $ionicTabsDelegate.select(tabIndex);
    $scope.getTabIndex();
    console.log("swiped")
  }

  $scope.toggleTransferWindow = function() {
    $scope.showTransferWindow == true? $scope.showTransferWindow = false: $scope.showTransferWindow=true;
    $ionicScrollDelegate.scrollTop();
  }

  $scope.toggleTemplateWindow = function() {
    if ($scope.showTemplateWindow == true)
      {
        $scope.showTemplateWindow = false
      }
    else 
      {
        $scope.showTemplateWindow=true;
        $scope.customProjects = TempProjects.all();
        $ionicScrollDelegate.scrollTop();
      }
  }  

  $scope.newTaskParent = function(task, projectIndex) {
    if ($scope.taskParent != projectIndex)
    {
      if ($scope.projects[projectIndex].category)
      {
        if ($scope.projects[projectIndex].category != "FAQ" && task.title == "") task.title = "No title"
        console.log($scope.projects[projectIndex])        
      }
      else
      {
        if (task.title == "") task.title = "No title"
      }

      if (task.isDone == "NO")
        {
          $scope.projects[projectIndex].tasks.unshift(task) //slot in at top of stack
          $scope.activeTask = $scope.projects[projectIndex].tasks[0]
        }
      else
        {
          $scope.projects[projectIndex].tasks.push(task)
          $scope.activeTask = $scope.projects[projectIndex].tasks[$scope.projects[projectIndex].tasks.length-1]
        }
      $scope.activeProject = $scope.projects[Projects.getLastActiveIndex()]
      var taskIndex = $scope.findTaskIndex($scope.activeProject.tasks, task.id);
      $scope.projects[$scope.taskParent].tasks.splice(taskIndex, 1);
      $scope.taskParent = projectIndex;
      $scope.taskIndex = 0; //complexity in determining new taskIndex if not at top

      Projects.save($scope.projects)    
      Projects.setLastActiveIndex(projectIndex)
      $scope.myLastActiveIndex = projectIndex
      $scope.activeProject = $scope.projects[projectIndex]
      $scope.getTabIndex()
    }
  }

  $scope.defaultProjects = function() {
    
    var pathToBackup = "https://s3-ap-southeast-1.amazonaws.com/needmeinfographic/NeedMeJson.txt"
    var defaultNumberToImport = 25
    $http.get(pathToBackup)
    .success(function (customProjects) {
        if (customProjects.length<25) defaultNumberToImport = customProjects.length
        for(var i=0;i<defaultNumberToImport;i++) {
          $scope.projectTemplate = customProjects[i].project;
          $scope.projectCategory = customProjects[i].category;
          var newProject = Projects.newProject(customProjects[i].project, customProjects[i].project, customProjects[i].category, customProjects[i].code);
          $scope.projects.push(newProject);
          $scope.activeProject = $scope.projects[$scope.projects.length-1]
          Projects.setLastActiveIndex($scope.projects.length-1)
          $scope.myLastActiveIndex = $scope.projects.length-1
          // if (customProjects[i].project == projectTemplate) {
              // for(var j=0; j<customProjects[i].titles.length; j++) {
              //     $scope.activeProject.tasks.push({
              //       id : Projects.getNextKeyValue(),
              //       code: customProjects[i].titles[j].code,
              //       topic: customProjects[i].titles[j].topic,
              //       description: customProjects[i].titles[j].description,
              //       title: customProjects[i].titles[j].title,
              //       origin: 'template',
              //       infographic: customProjects[i].titles[j].infographic,
              //       data: customProjects[i].titles[j].data,
              //       type: customProjects[i].titles[j].type,
              //       isDone: 'NO',
              //       createDate: (new Date()).toISOString(),
              //       images: customProjects[i].titles[j].images,
              //       unit: 1,
              //       pricePerUnit: 0
              //     });      
              //   }
          // }
            } 
      Projects.save($scope.projects)
      $scope.propertiesHidden = false
    });
  }

  $scope.getTotal = function() {
    if ($scope.activeProject && $scope.activeProject.hasOwnProperty('type') && $scope.activeProject.type)
    {
      var totalValue = 0;
      for(var j=0;j<$scope.activeProject.tasks.length;j++)  
      {
        if ($scope.activeProject.tasks[j].unit && $scope.activeProject.tasks[j].pricePerUnit)
        totalValue = parseInt(totalValue) + (parseInt($scope.activeProject.tasks[j].unit) * parseInt($scope.activeProject.tasks[j].pricePerUnit))
      }
    }
    return totalValue;  
  }  

  $scope.updateProject = function(i) {
    if (!$scope.projects) {
      return;
    } 
    $scope.projects[i].title = $scope.activeProject.title;
    if ($scope.projects[i].title == "") $scope.projects[i].title = "No title"
    Projects.setLastActiveModal('');
    Projects.save($scope.projects);
    $scope.activeProject = $scope.projects[i];
    $scope.autoSaveShow = true;
  };

  $scope.deleteProject = function(i) {
    console.log(i)
    if (!$scope.activeProject) {
      return;
    }
    console.log("start deleting");
    $scope.showConfirm('Delete Folder', 'Delete <b>' + $scope.activeProject.title + '</b>?',function() {
      for(var j=0;j<$scope.projects[i].tasks.length;j++)
      {
        var imageArrayField = $scope.projects[i].tasks[j].images
        if (imageArrayField != "" && imageArrayField != null && imageArrayField != undefined)  
          {
            for (var k=0;k<$scope.projects[i].tasks[j].images.length;k++)
            {
              console.log($scope.projects[i].tasks[j].images[k].imgURI)
              imagePath = $scope.projects[i].tasks[j].images[k].imgURI;
              $scope.removeQueueImage(imagePath);
            }
          }
      }
      console.log($scope.activeProject.collaborators)
      $scope.projects.splice(i,1);
      Projects.save($scope.projects);
      $scope.showSubTotal = false;
      Projects.setLastActiveIndex(0);
      $scope.myLastActiveIndex = 0;
      if ($scope.projects.length == 0)
        {
          $scope.activeProject = [];
          $scope.propertiesHidden = true
        }
      else
        {
          $scope.activeProject = $scope.projects[Projects.getLastActiveIndex()]
        }
      $scope.activeProject.collaborators = [];
      $ionicTabsDelegate.select(0);
      $ionicScrollDelegate.$getByHandle('.cardmenuproject').scrollTop();
    });
  }

  $scope.createTask = function(task) {
    // create task function

    if (document.getElementById("createtask")) document.getElementById("createtask").disabled=true;
    if (!$scope.activeProject || !task) {
      return;
    }
    console.log(task)
    console.log($scope.activeProject.category)
    if ((!task.title && $scope.tempimages.length == 0 && (!$scope.activeProject.category || $scope.activeProject.category == "blank")) 
      // || ($scope.activeProject.category == "FAQ" && !task.topic)
      // || ($scope.activeProject.category == "education" && !task.topic && !task.title && $scope.tempimages.length == 0) 
      // || ($scope.activeProject.category == "subtotal")
      // || ($scope.activeProject.category == "checklist")
      ) 
    {
      $scope.closeNewTask();
      console.log("none")
      if ($scope.currentPlatform == "android" || $scope.currentPlatform == "ios") $cordovaToast.showShortCenter("No note saved. Missing title.")
      return;
    }

    var myAlarmTime = null
    var newTaskId = Projects.getNextKeyValue()
    if (!task.title && !task.topic) 
    {
      task.title = (new Date()).toLocaleString()
    }
    $scope.lastIndex = 0;
    for(var i=0;i<$scope.activeProject.tasks.length;i++) {
      if ($scope.activeProject.tasks[i].isDone == 'NO') $scope.lastIndex = $scope.lastIndex + 1;
    }    

    if ($scope.taskModal.isShown()) $scope.taskModal.hide();
    Projects.setLastActiveModal(''); 

    if (($scope.task.dueDate && $scope.task.dueDate !== "") && $scope.task.dueTime == null) $scope.task.dueTime = "05:00:00 PM"
    
    $scope.activeProject.tasks.push({
      id : newTaskId,
      topic: task.topic,
      description: task.description,       
      title: task.title,     
      origin: 'self',
      type: task.type,
      isDone: 'NO',
      createDate: (new Date()).toISOString(),
      dueDate: task.dueDate,
      dueTime: task.dueTime,
      images: [],
      unit: task.unit | "1",
      pricePerUnit: task.pricePerUnit | "0"
    }); 

    var newtasknumber = $scope.activeProject.tasks.length - 1;
    
    $scope.activeTask = $scope.projects[Projects.getLastActiveIndex()].tasks[newtasknumber];
    $scope.activeTask = $scope.activeProject.tasks[newtasknumber];
    for(var i=0;i<$scope.tempimages.length;i++) {
      $scope.activeTask.images.push({
        imgURI: $scope.tempimages[i].imageURI
      });   
      // console.log($scope.tempimages[i].imageURI);
    }
    TempImages.clear();
    $scope.tempimages = TempImages.all();

    if (Projects.getNewItemIsTop() === "true") {
      var moved = $scope.activeProject.tasks.splice(newtasknumber, 1);
      $scope.activeProject.tasks.splice(0, 0, moved[0]);  
      Projects.setLastTaskIndex(0) 
      $ionicScrollDelegate.scrollTop(); 
    }
    else {
      var moved = $scope.activeProject.tasks.splice(newtasknumber, 1);
      $scope.activeProject.tasks.splice($scope.lastIndex, 0, moved[0]); 
      Projects.setLastTaskIndex($scope.lastIndex)     
      $ionicScrollDelegate.scrollBottom();
    }
 
    Projects.save($scope.projects);
    // Projects.store($scope.activeProject); //one errand project only

    if ($scope.currentPlatform == "android" || $scope.currentPlatform == "ios") $cordovaToast.showShortCenter('New note has been created')

    if ($scope.activeTask.dueDate && $scope.activeTask.dueTime)
      {
        var myAlarmTime = new Date($scope.activeTask.dueDate + ', ' + $scope.activeTask.dueTime)
      }
    if (myAlarmTime && myAlarmTime <= new Date())
      {

      } 
    else
      {
        if (($scope.currentPlatform == "android" || $scope.currentPlatform == "ios") && myAlarmTime) 
          {
            if ($scope.activeProject.hasOwnProperty('category') && ($scope.activeProject.category == "FAQ" || $scope.activeProject.category == "education"))
            {
              $scope.addLocalNotification(newTaskId, $scope.activeProject.title, task.topic, myAlarmTime)
            }
            else
            {
              $scope.addLocalNotification(newTaskId, $scope.activeProject.title, task.title, myAlarmTime)
            }
          }
      }
    $scope.task = [];
    $scope.suggestionMessage = null;
    $scope.notDoneLimit = $scope.activeProject.tasks.length + 1;
  };

  $scope.updateTask = function(task) {
    if (!$scope.activeProject || !task) {
      return;
    }
    var taskIndex = $scope.findTaskIndex($scope.activeProject.tasks, task.id);
    $scope.activeProject.tasks[taskIndex] = $scope.task;
    $scope.activeTask = $scope.projects[Projects.getLastActiveIndex()].tasks[taskIndex];
    $scope.tempimages = TempImages.all()
    for(var i=0;i<$scope.tempimages.length;i++) {
      $scope.activeTask.images.push({
        imgURI: $scope.tempimages[i].imageURI
      });
    }
    TempImages.clear();
    $scope.tempimages = TempImages.all();
    if (Projects.getLastActiveModal() == 'taskModal')
    {
      $scope.taskModal.hide();
    }
    Projects.save($scope.projects);
  };

  $scope.updateTaskAuto = function(task) {
    if (!$scope.activeProject || !task) {
      return;
    }
    console.log("updated")
    var taskIndex = $scope.findTaskIndex($scope.activeProject.tasks, task.id);
    var myAlarmTime = null
    if (!task.title && !task.topic)
    {
      task.title = "No title";
    }
    if (!task.topic && ($scope.activeProject.category == "FAQ"))
    {
      task.topic = "No title";
    }
    $scope.activeProject.tasks[taskIndex] = task;
    $scope.activeTask = $scope.projects[Projects.getLastActiveIndex()].tasks[taskIndex];
    if ($scope.activeTask.dueDate !== "" && $scope.activeTask.dueTime == null) $scope.activeTask.dueTime = "05:00:00 PM"
    if ($scope.activeTask.unit == null || $scope.activeTask.unit <= "0") $scope.activeTask.unit = 1
    if ($scope.activeTask.pricePerUnit == null || $scope.activeTask.pricePerUnit < "0") $scope.activeTask.pricePerUnit = 0

    Projects.save($scope.projects);
    if ($scope.referrer != "") 
      {
       $scope.getAllTask();
      }
    $scope.urlList = findUrls(task.title);
    $scope.autoSaveShow = true;

    if ($scope.activeTask.dueDate && $scope.activeTask.dueTime)
      {
        var myAlarmTime = new Date($scope.activeTask.dueDate + ', ' + $scope.activeTask.dueTime)
      }
    if (myAlarmTime && myAlarmTime <= new Date())
      {
        if (($scope.currentPlatform == "android" || $scope.currentPlatform == "ios") && myAlarmTime)
          {
            $scope.cancelLocalNotification(task.id)
          }
      } 
    else
      {
        if (($scope.currentPlatform == "android" || $scope.currentPlatform == "ios") && myAlarmTime) 
          {
            if ($scope.activeProject.hasOwnProperty('category') && ($scope.activeProject.category == "FAQ" || $scope.activeProject.category == "education"))
            {
              $scope.addLocalNotification(task.id, $scope.activeProject.title, task.topic, myAlarmTime)
            }
            else
            {
              $scope.addLocalNotification(task.id, $scope.activeProject.title, task.title, myAlarmTime)
            }
          }
      }
  }

  $scope.deleteTask = function(task, referrer) {
    if (!$scope.activeProject || !task ) {
      return;
    }
    var deleteMsg = '';
    if (task.topic) 
      {
        deleteMsg = task.topic;
      }
    else
      {
        deleteMsg = task.title;
      }
    $scope.showConfirm('Delete Note', '<b>' + deleteMsg.trim() + '</b>', function() {
      var taskIndex = $scope.findTaskIndex($scope.activeProject.tasks, task.id);
      var imageArrayField = $scope.activeProject.tasks[taskIndex].images
      if (imageArrayField != "" && imageArrayField != null && imageArrayField != undefined)
      {
        for(var i=0;i<$scope.activeProject.tasks[taskIndex].images.length;i++)
        {
          imagePath = $scope.activeProject.tasks[taskIndex].images[i].imgURI;
          console.log(imagePath);
          $scope.removeQueueImage(imagePath);
        }
      }
      $scope.activeProject.tasks.splice(taskIndex,1);
      Projects.save($scope.projects);
      $ionicScrollDelegate.scrollBy(0,0,true);
      if (Projects.getLastActiveModal() == "editTaskModal") {
        $scope.closeEditTask(referrer);
        console.log("deleted")
      }
      if ($scope.currentPlatform == "android" || $scope.currentPlatform == "ios") $scope.cancelLocalNotification(task.id)
    });
  }   

  $scope.editSetting = function() {
    $scope.editSettingModal.show();
    Projects.setLastActiveModal('editSettingModal');
    $ionicSideMenuDelegate.toggleLeft();
  };

  $scope.openPlaces = function() {
    $scope.myPlacesList = TempPlaces.all()
    // console.log($scope.myPlacesList)
    $scope.placesModal.show();
    $ionicScrollDelegate.scrollTop();
    Projects.setLastActiveModal('placesModal');
  };

  $scope.openCalendar = function() {

    $scope.uiConfig = {
      calendar:{
        defaultView: 'month',
        editable: true,
        disableResizing:true,
        height: 'auto',
        header:{
          left: 'prev',
          center: 'title',
          right: 'next'
        },
        events: $scope.upcomingEventSources,
        // events: [{title: 'Pay PTPTN',start: new Date(2016,9,19),allDay: true}],
        eventDrop: $scope.alertOnDrop,
        eventResize: $scope.alertOnResize,
        eventRender: $scope.eventRender,
        eventClick: function (calEvent, jsEvent, view) {
          console.log(calEvent.title);
          if ($scope.currentPlatform == "android" || $scope.currentPlatform == "ios") $cordovaToast.showShortCenter(calEvent.title)
        }

      }
    };
    $scope.calendarModal.show();
    $ionicScrollDelegate.scrollTop();
    Projects.setLastActiveModal('calendarModal');
  };      

  $scope.openSearch = function() {

    $scope.getAllTask();
    $scope.searchModal.show();
    $ionicScrollDelegate.scrollTop();
    $scope.referrer = "searchModal"
    Projects.setLastActiveModal('searchModal');
    // $timeout(function () {
    //   $ionicSideMenuDelegate.toggleLeft();
    // }, 100)     
  };   

  $scope.getAllTask = function() {
    $scope.allTasks = [];
    for(var i=0;i<$scope.projects.length;i++)
    {
      for(var j=0;j<$scope.projects[i].tasks.length;j++)
      {     
        $scope.allTasks.push ({
          projectIndex: i,
          taskId: $scope.projects[i].tasks[j].id,
          projectTitle: $scope.projects[i].title,
          taskTopic: $scope.projects[i].tasks[j].topic,
          taskDescription: $scope.projects[i].tasks[j].description,
          taskTitle: $scope.projects[i].tasks[j].title
        });      
      } 
    }    
  }

  $scope.jumpToEditTask = function(taskId, referrer, projectIndex) {
    for(var i=0;i<$scope.projects.length;i++)
    {
      for(var j=0;j<$scope.projects[i].tasks.length;j++)
      {     
          if ($scope.projects[i].tasks[j].id == taskId)
          {
            var matchedTask = $scope.projects[i].tasks[j];
            if ($scope.projects[i].hasOwnProperty('protect') && $scope.projects[i].protect == "true")
            {
              $cordovaTouchID.checkSupport().then(function() {
                // success, TouchID supported
                $cordovaTouchID.authenticate("Unlock with your fingerprint").then(function() {
                  // successful authentication
                  $scope.biometryLockedOut = false
                  $scope.redirectToEditTask(matchedTask, referrer, projectIndex)
                }, function (errorCode) {
                  // error authenticating
                  if ($scope.currentPlatform == "android" || $scope.currentPlatform == "ios") $cordovaToast.showShortCenter(errorCode)
                });
              }, function (error) {
                // TouchID not supported
                if (error == "Biometry is locked out.")
                {
                  $scope.biometryLockedOut = true
                  $ionicTabsDelegate.select(0)
                  $scope.activeProject = $scope.projects[Projects.getLastActiveIndex()];
                  $scope.currentTabIndex = $ionicTabsDelegate.selectedIndex();
                  if ($scope.currentPlatform == "android" || $scope.currentPlatform == "ios") $cordovaToast.showShortCenter(error)
                }
                else
                {
                  $scope.redirectToEditTask(matchedTask, referrer, projectIndex)
                }
              });
            }
            else
            {
              $scope.redirectToEditTask(matchedTask, referrer, projectIndex)
            }
            break;
          }  
      } 
    }
  }  

  $scope.redirectToEditTask = function(matchedTask, referrer, projectIndex) {
    $scope.searchModal.hide();
    Projects.setLastActiveModal('');
    $scope.referrer = "";
    $scope.editTask(matchedTask, referrer, projectIndex)
  }

  $scope.newProject = function(projectTitle) {
    // $scope.getProjectTemplates()
    $scope.newProjectModal.show();
    Projects.setLastActiveModal('newProjectModal');
    // $ionicSideMenuDelegate.toggleLeft();
    $scope.projectTemplate = "Blank Folder";
    $scope.projectCategory = "blank";
    document.getElementById("createproject").disabled=false;
    // $scope.customProjects = TempProjects.all();
    }  

  $scope.editProject = function(project) {
    var i = Projects.getLastActiveIndex();
    $scope.project = {title: $scope.projects[i].title, tasks: $scope.projects[i].tasks};
    $scope.myLastActiveIndex = i;
    $scope.editProjectModal.show();
    Projects.setLastActiveModal('editProjectModal');
    $scope.propertiesStack = false;
  };

  $scope.pasteValue = function(value) {
    console.log(value)
    $( "#taskTitle" ).focus()
    var appendedNote = $scope.task.title || ''
    appendedNote = appendedNote + ' ' + value
    appendedNote = appendedNote.trim()
    $scope.task.title = appendedNote
    $scope.showClipboard = false
    $('#taskTitle').blur();
  }

  $scope.getClipboardValue = function() {
    $scope.showClipboard = true
    // console.log('Checking the clipboard...');
    if ($scope.currentPlatform == "android" || $scope.currentPlatform == "ios")
    {
      $cordovaClipboard
        .paste()
        .then(function (result) {
          console.log(result);
          $scope.clipboardValue = result
        }, function (e) {
        console.log(e)
      });
    }
    else
    {
      $scope.clipboardValue = "cbv"
    }
  }

  $scope.newTask = function() {
    // new task function

    if (!$scope.activeProject)
    {
      if ($scope.currentPlatform == "android" || $scope.currentPlatform == "ios") $cordovaToast.showShortCenter("Create a folder first")
      $ionicTabsDelegate.select(0)
      return;
    }

    var myArray = ['a reminder', 'any amount of images', 'a place i like', 'using the voice recognizer on my keyboard'];
    var rand = myArray[Math.floor(Math.random() * myArray.length)];
    $scope.getClipboardValue();
    $scope.urlList = []
    $scope.gpsAddressList = []
    $scope.task = {}
    $scope.activeProject = $scope.projects[Projects.getLastActiveIndex()]; //just in case, to remove if not needed
    switch ($scope.activeProject.category){
      case "FAQ" :  
        $scope.placeholder = "Type my answer"
        break;
      case "subtotal" :
        $scope.placeholder = "Type my itenary"
        break;
      case "education" :
        $scope.placeholder = "Add my notes"
        break;
      default:
        $scope.placeholder = "Add my notes. I can also add " + rand
      }        
    $scope.taskModal.show();
    Projects.setLastActiveModal('taskModal');
    $scope.propertiesStack = false;
    document.getElementById("createtask").disabled=false;

  };

  $scope.editTask = function(task, referrer, projectIndex) {
    //Edit Task Function
    console.log(task)
    $scope.getClipboardValue();
    if ($ionicSideMenuDelegate.isOpenLeft()) $ionicSideMenuDelegate.toggleLeft();
    $scope.currentDateTime = new Date().getTime()
    $scope.referrer = referrer;
    $scope.activeProject = $scope.projects[projectIndex];
    Projects.setLastActiveIndex(projectIndex);
    $scope.myLastActiveIndex = projectIndex;
    $scope.taskParent = Projects.getLastActiveIndex();
    var taskIndex = $scope.findTaskIndex($scope.activeProject.tasks, task.id);
    $scope.taskIndex = taskIndex;
    Projects.setLastTaskIndex(taskIndex);
    Projects.setLastActiveModal('editTaskModal');
    $scope.activeTask = $scope.activeProject.tasks[Projects.getLastTaskIndex()]; 
    console.log($scope.activeTask)
    if (!$scope.activeTask.images) {
      $scope.activeTask.images = [];
      console.log($scope.projects);
    }
    switch ($scope.activeProject.category){
      case "FAQ" :  
        $scope.placeholder = "Type my answer"
        break;
      case "subtotal" :
        $scope.placeholder = "Type my itenary"
        break;
      case "education" :
        $scope.placeholder = "Add my notes"
        break;
      default:
        $scope.placeholder = "Add my notes"
      }
    $scope.task = {title: task.title, origin: task.origin, infographic: task.infographic, type: task.type, isDone: task.isDone, createDate: task.createDate, id : task.id, images: task.images, dueDate: task.dueDate, dueTime: task.dueTime, unit: task.unit, pricePerUnit: task.pricePerUnit, type: task.type, topic: task.topic, description: task.description, code: task.code, data: task.data};
    $scope.urlList = findUrls(task.title);
    $scope.gpsAddressList = findGPS(task.title);
    if ($scope.editTaskModal.isShown())
    {
      console.log("shown")
    }
    else
    {
      console.log("not shown")
      $scope.editTaskModal.show();
      // if ($scope.task.infographic) $scope.infographicSrc = $scope.task.infographic
      // $ionicTabsDelegate.select(3)
      // $ionicScrollDelegate.scrollTop();
    }
  };

  $scope.newCollaborator = function() {
    Projects.setLastActiveModal('newCollaboratorModal');
    $scope.newCollaboratorModal.show();
  };  

  $scope.showAccomplishment = function() {
    // if (Projects.getLastActiveModal() != "accomplishmentModal")
    if (!$scope.accomplishmentModal.isShown())
    {      
      $scope.accomplishmentModal.show();
      Projects.setLastActiveModal('accomplishmentModal');
      $timeout(function () {
        $ionicSideMenuDelegate.toggleLeft();
      }, 500)      
    }
  }  

  $scope.showUpcoming = function() {
    $scope.upcomingModal.show();
    Projects.setLastActiveModal('upcomingModal');
    $ionicSideMenuDelegate.toggleLeft();
  }

  $scope.showPopupImage = function(index,prevPage) {
    $ionicScrollDelegate.resize()
    index == 0 ? $scope.prevActiveImageIndex = $scope.activeTask.images.length-1 : $scope.prevActiveImageIndex = index - 1
    index == $scope.activeTask.images.length-1 ? $scope.nextActiveImageIndex = 0 : $scope.nextActiveImageIndex = index + 1
    $scope.activeImageIndex = index;
    $scope.activePrevPage = prevPage;
    $scope.backgroundURI = $scope.activeTask.images[index].imgURI
    if ($scope.currentPlatform == 'ios') $scope.backgroundURI = $scope.uuidPath + $scope.activeTask.images[index].imgURI
    // if ($scope.currentPlatform == 'android') $scope.backgroundURI = $scope.activeTask.images[index].imgURI
    Projects.setLastActiveModal('gallery-zoomview');
    console.log($scope.backgroundURI)
    if (!$scope.PopupImageModal.isShown())
    {
      $scope.PopupImageModal.show(); 
    }
  };

  $scope.showPopupTempImage = function(index,prevPage) {
    $scope.tempImages = TempImages.all();
    index == 0 ? $scope.prevActiveTempImageIndex = $scope.tempImages.length-1 : $scope.prevActiveTempImageIndex = index - 1
    index == $scope.tempImages.length-1 ? $scope.nextActiveTempImageIndex = 0 : $scope.nextActiveTempImageIndex = index + 1    
    $scope.activeTempImageIndex = index;
    $scope.activePrevPage = prevPage;
    $scope.backgroundURI = $scope.tempimages[index].imageURI
    if ($scope.currentPlatform == 'ios') $scope.backgroundURI = $scope.uuidPath + $scope.tempimages[index].imageURI
    // if ($scope.currentPlatform == 'android') $scope.backgroundURI = $scope.tempimages[index].imageURI
    Projects.setLastActiveModal('gallery-zoomview-temp');
    if (!$scope.PopupTempImageModal.isShown())
    {
      $scope.PopupTempImageModal.show(); 
    }
    // $scope.showPopupImageModal('templates/gallery-zoomview-temp.html');
  };    

  $scope.showPopupImageModal = function(templateUrl) {
    $ionicModal.fromTemplateUrl(templateUrl, {
      scope: $scope,
      animation: 'none'
    }).then(function(modal) {
      $scope.PopupImageModal = modal;
      if (!$scope.PopupImageModal.isShown())
      {
        $scope.PopupImageModal.show();
        console.log("showpopup")
      }
    });
  } 

  $scope.toggleMoreProperties = function() {
    $scope.propertiesStack == false ? $scope.propertiesStack = true : $scope.propertiesStack = false;
  }

  $scope.toggleExpandAccomplishment = function() {
    $scope.expandAccomplishment == false ? $scope.expandAccomplishment = true : $scope.expandAccomplishment = false;
  }

  $scope.toggleExpandReminder = function() {
    $scope.expandReminder == false ? $scope.expandReminder = true : $scope.expandReminder = false;
  }  

  $scope.toggleFolderProtect = function() {
    if (!$scope.activeProject.hasOwnProperty('protect'))
    {
      $scope.activeProject.protect = "true";
    }
    else 
    {
      $scope.activeProject.protect == "true" ? $scope.activeProject.protect = "false" : $scope.activeProject.protect = "true"
    }
    console.log($scope.activeProject)
    Projects.save($scope.projects)
  } 

  $scope.hideMoreProperties = function() {
    $scope.propertiesStack = false
  }

  $scope.showConfirm = function(title, message, onYes, onNo) {
   var confirmPopup = $ionicPopup.confirm({
     title: title,
     template: message
   });
   confirmPopup.then(function(res) {
     if(res) {
       onYes();
     } else {
       if (onNo)
        onNo();
     }
   });
  };

  $scope.closeEditSetting = function() {
    $scope.editSettingModal.hide();
    Projects.setLastActiveModal('');
    $ionicSideMenuDelegate.toggleLeft();
  };  

  $scope.closeSearch = function() {
    $scope.searchModal.hide();
    Projects.setLastActiveModal('');
    $scope.referrer = "";
    // $ionicSideMenuDelegate.toggleLeft();
  };

  $scope.closeNewProject = function() {
    // $ionicSideMenuDelegate.toggleLeft();
    $scope.newProjectModal.hide();
    Projects.setLastActiveModal('');
    $scope.projects.title = "";
    $scope.showTemplateWindow = false;
  };  

  $scope.closeNewTask = function() {
    Projects.setLastActiveModal('');
    for(var i=0;i<$scope.tempimages.length;i++) {
      $scope.removeQueueImage($scope.tempimages[i].imageURI);
    }
    // if ($scope.task.audioURI) $scope.deleteTaskAudio($scope.task.audioURI)
    TempImages.clear(); 
    $scope.tempimages = TempImages.all();
    $scope.taskModal.hide();
    if ($scope.currentPlatform == "android" || $scope.currentPlatform == "ios") $cordovaToast.showShortCenter("No note saved")
  };

  $scope.closeEditTask = function(referrer) {
    Projects.setLastActiveModal(referrer);
    if (referrer == "searchModal") 
      {
        // $scope.searchModal.show();
        $scope.allTasks = [];
        for(var i=0;i<$scope.projects.length;i++)
        {
          for(var j=0;j<$scope.projects[i].tasks.length;j++)
          {     
            $scope.allTasks.push ({
              projectIndex: i,
              taskId: $scope.projects[i].tasks[j].id,
              projectTitle: $scope.projects[i].title,
              taskTopic: $scope.projects[i].tasks[j].topic,
              taskDescription: $scope.projects[i].tasks[j].description,
              taskTitle: $scope.projects[i].tasks[j].title
            });      
          } 
        }         
        // $scope.openSearch();
        $scope.getAllTask();
        $scope.searchModal.show();
        $ionicScrollDelegate.scrollTop();
        $scope.referrer = "searchModal"
        Projects.setLastActiveModal('searchModal');
      }
    else if (referrer == "dashboard")
    {
      $ionicSideMenuDelegate.toggleLeft();
      $scope.getAccomplishment();
      if ($scope.currentPlatform == 'android' || $scope.currentPlatform == 'ios') $scope.getUpcomingEvents();
    }
    for(var i=0;i<$scope.tempimages.length;i++) {
      $scope.removeQueueImage($scope.tempimages[i].imageURI);
    }   
    $scope.showTransferWindow = false; 
    TempImages.clear(); 
    $scope.tempimages = TempImages.all();    
    $scope.editTaskModal.hide();
    $scope.infographicSrc = null
    console.log($scope.task)
  };

  $scope.closeNewCollaborator = function() {
    Projects.setLastActiveModal('');
    var input = $('input');
    input.val('');
    $scope.contacts = [];
    $scope.newCollaboratorModal.hide();
  };

  $scope.closePlaces = function() {
    $scope.placesModal.hide();
    Projects.setLastActiveModal('taskModal');
  };   

  $scope.closeProjects = function() {
    $scope.projectsModal.hide();
    Projects.setLastActiveModal('');
  }; 

  $scope.closeCalendar = function() {
    $scope.calendarModal.hide();
    Projects.setLastActiveModal('');
  };    

  $scope.closePopupImageModal = function(prevPage) {
    Projects.setLastActiveModal(prevPage);
    $scope.PopupImageModal.hide();
    console.log("closepopup")
    // $scope.PopupImageModal.remove()
  }; 

  $scope.closePopupTempImageModal = function(prevPage) {
    Projects.setLastActiveModal(prevPage);
    $scope.PopupTempImageModal.hide();
    console.log("closepopup")
    // $scope.PopupImageModal.remove()
  }; 

  $scope.toggleNewItemIsTop = function() {
    if ($scope.newitemistop == "true")
    {
      Projects.setNewItemIsTop("false");
    }
    else
    {
      Projects.setNewItemIsTop("true");
    }
    $scope.newitemistop = Projects.getNewItemIsTop();
  };  

  $scope.toggleCompleteHidden = function() {
    if ($scope.completehidden == "true")
    {
      Projects.setCompleteHidden("false");
    }
    else
    {
      Projects.setCompleteHidden("true");
      $scope.rearrangeAllTasks();
    }
    $scope.completehidden = Projects.getCompleteHidden();
  };  

  $scope.toggleEnableBackground = function() {
    if ($scope.enablebackground == "true")
    {
      Projects.setEnableBackground("false");
      cordova.plugins.backgroundMode.disable();
    }
    else
    {
      Projects.setEnableBackground("true");
      cordova.plugins.backgroundMode.enable();
    }
    $scope.enablebackground = Projects.getEnableBackground();
  }; 

  $scope.toggleProjects = function() {
    $ionicSideMenuDelegate.toggleLeft();
    $scope.getAccomplishment();
    if ($scope.currentPlatform == 'android' || $scope.currentPlatform == 'ios') $scope.getUpcomingEvents();
    // $ionicScrollDelegate.$getByHandle('.insetprojecttask').scrollTop();
    // $scope.propertiesStack = false;
  };

  $scope.showActions = function(message, image, link) {
  console.log(message, image, link)
   var hideSheet = $ionicActionSheet.show({
     buttons: [
       { text: '<b>Share in WhatsApp</b>' },
       { text: '<b>Share in Twitter</b>' },
       { text: '<b>Share in Facebook</b>' }
     ],
     //destructiveText: 'Delete',
     //titleText: 'Share Options',
     //cancelText: 'Cancel',
     cancel: function() {
          // add cancel code..
        },
     destructiveButtonClicked: function() {
          // add delete code..
        },        
     buttonClicked: function(index) {
       switch (index){
        case 0 :
          $scope.shareByWhatsApp(message, image, link);
          console.log (index);
          return true;
        case 1 :
          $scope.shareByTwitter(message, image, link);
          console.log (index);
          return true;
        case 2 :
          $scope.shareByFacebook(message, image, link);
          console.log (index);
          return true;
        }  
       return true;
     }
   });
   $timeout(function() {
     hideSheet();
   }, 3000);
 };

  $scope.showImageActions = function(message, image, link, imageIndex, task) {
   console.log(imageIndex)
   var hideSheet = $ionicActionSheet.show({
     buttons: [
       { text: '<b>Share in WhatsApp</b>' },
       { text: '<b>Share in Twitter</b>' },
       { text: '<b>Share in Facebook</b>' },
       { text: '<b class="assertive">Delete picture</b>' }
     ],
     //destructiveText: 'Delete',
     //titleText: 'Share Options',
     //cancelText: 'Cancel',
     cancel: function() {
          // add cancel code..
        },
     destructiveButtonClicked: function() {
          // add delete code..
        },        
     buttonClicked: function(index) {
       switch (index){
        case 0 :
          $scope.shareByWhatsApp(message, image, link);
          console.log (index);
          return true;
        case 1 :
          $scope.shareByTwitter(message, image, link);
          console.log (index);
          return true;
        case 2 :
          $scope.shareByFacebook(message, image, link);
          console.log (index);
          return true;
        case 3 :
          $scope.removeImage(image, imageIndex, task)
          console.log(message, image, link, imageIndex, task)
          // console.log(image) 
          return true;
        }  
       return true;
     }
   });
   $timeout(function() {
     hideSheet();
   }, 3000);
 };

  // share to whatsapp easily
  $scope.shareByWhatsApp = function(message, image, link) {
     // angular.forEach($scope.activeProject.tasks, function(task) {
     //   message = message + task.title + "\nDone: " + task.isDone + "\n\n"
     // })
     console.log(message)   
     $cordovaSocialSharing
         .shareViaWhatsApp(message, image, 'Note w ' + link)
         .then(function(result) {
         }, function(err) {
             alert("error : "+err);
         });
  }; 

  $scope.shareByTwitter= function(message, image, link) {
      var hashtag = $scope.activeProject.title
      hashtag = hashtag.replace(/ +/g, "")
      $cordovaSocialSharing
        .shareViaTwitter('#' + hashtag + ' ' + message, image, 'Note w ' + link)
        .then(function(result) {
          // Success!
        }, function(err) {
          // An error occurred. Show a message to the user
          console.log(err)
        });
  }; 

  $scope.shareByFacebook= function(message, image, link) {
     console.log(message)
      $cordovaSocialSharing
        .shareViaFacebook(message, image, link)
        .then(function(result) {
          // Success!
        }, function(err) {
          // An error occurred. Show a message to the user
        });
  };

  // drag and drop reorder
  $scope.onReorder = function (fromIndex, toIndex) {
      var moved = $scope.activeProject.tasks.splice(fromIndex, 1);
      $scope.activeProject.tasks.splice(toIndex, 0, moved[0]);
      Projects.save($scope.projects);
  };  

  $scope.onReorderTempImages = function (fromIndex, toIndex) {
      var moved = $scope.tempimages.imageURI.splice(fromIndex, 1);
      $scope.tempimages.imageURI.splice(toIndex, 0, moved[0]);
      TempImages.save($scope.tempimages);
  };  

  $scope.onReorderImages = function (fromIndex, toIndex) {
      var moved = $scope.activeTask.images.splice(fromIndex, 1);
      $scope.activeTask.images.splice(toIndex, 0, moved[0]);
      Projects.save($scope.projects);
  };  

  $scope.onReorderProject = function (fromIndex, toIndex) {
        var moved = $scope.projects.splice(fromIndex, 1);
        $scope.projects.splice(toIndex, 0, moved[0]);
        Projects.save($scope.projects);    
        $scope.activeProject = $scope.projects[toIndex]; 
        Projects.setLastActiveIndex(toIndex)
        // $scope.projectIndex = toIndex;
        $scope.myLastActiveIndex = toIndex;
  }; 


  // enable picture taking during add task
  $scope.takePicture = function(task) {

    if ($scope.currentPlatform == "ios")
    {
      var options = { 
        quality : 100, 
        destinationType : Camera.DestinationType.FILE_URI, 
        sourceType : Camera.PictureSourceType.CAMERA, 
        allowEdit : false,
        encodingType: Camera.EncodingType.JPEG,
        targetWidth: 1024,
        // targetHeight: 1024,
        popoverOptions: CameraPopoverOptions,
        correctOrientation: true,
        saveToPhotoAlbum: true
      };
    }
    else
    {
      var options = { 
        quality : 100, 
        destinationType : Camera.DestinationType.FILE_URI, 
        sourceType : Camera.PictureSourceType.CAMERA, 
        allowEdit : true,
        encodingType: Camera.EncodingType.JPEG,
        targetWidth: 1024,
        // targetHeight: 1024,
        popoverOptions: CameraPopoverOptions,
        correctOrientation: true,
        saveToPhotoAlbum: true
      };
    }

  $cordovaCamera.getPicture(options).then(function(imageData) {
    var myFileName = Math.floor(Date.now());
    var pathToFolder = "";
    if ($scope.currentPlatform == "android") {
      pathToFolder = cordova.file.externalDataDirectory;
    }
    else if ($scope.currentPlatform == "ios") {
      pathToFolder = cordova.file.applicationStorageDirectory + "Library/Cloud/"
    }
    $cordovaFileTransfer.download(imageData, pathToFolder + myFileName + '.jpg', {}, true).then(
      function(fileEntry)
        {
          var newimageData;
          if ($scope.currentPlatform == "android") newimageData = fileEntry.nativeURL;
          if ($scope.currentPlatform == "ios") newimageData = "Library/Cloud/" + myFileName + ".jpg";
          var newTempImage = TempImages.newTempImage(newimageData);
          $scope.tempimages.push(newTempImage);
          TempImages.save($scope.tempimages);
          console.log(Projects.getLastActiveModal())
          if (Projects.getLastActiveModal() == 'editTaskModal')
          {
            $scope.updateTask($scope.activeTask);
          }
          $cordovaCamera.cleanup();
        },
        function (error)
          {
            console.log(error);
            $cordovaCamera.cleanup();
          }
        );
    }, function(err) {
      // An error occured. Show a message to the user
      console.log("nothing error works")
    });

  }

// open PhotoLibrary
$scope.openPhotoLibrary = function(task) {
    var options = {
        quality: 100,
        destinationType: Camera.DestinationType.FILE_URI,
        sourceType: Camera.PictureSourceType.SAVEDPHOTOALBUM,
        allowEdit: false,
        encodingType: Camera.EncodingType.JPEG,
        targetWidth: 1024,
        // targetHeight: 1024,        
        popoverOptions: CameraPopoverOptions,
        correctOrientation: true,
        saveToPhotoAlbum: false
    };

  $cordovaCamera.getPicture(options).then(function(imageData) {
    //$scope.imgURI = "data:image/jpeg;base64," + imageData;
    var myFileName = Math.floor(Date.now());
    var pathToFolder = "";
    if ($scope.currentPlatform == "android") {
      pathToFolder = cordova.file.externalDataDirectory;
    }
    else if ($scope.currentPlatform == "ios") {
      // pathToFolder = cordova.file.syncedDataDirectory;
      pathToFolder = cordova.file.applicationStorageDirectory + "Library/Cloud/"
      // console.log(pathToFolder)
    }
    console.log(imageData)
    $cordovaFileTransfer.download(imageData, pathToFolder + myFileName + '.jpg', {}, true).then(
      function(fileEntry)
        {
          // var newimageData = fileEntry.nativeURL;
          var newimageData;
          if ($scope.currentPlatform == "android") newimageData = fileEntry.nativeURL;
          if ($scope.currentPlatform == "ios") newimageData = "Library/Cloud/" + myFileName + ".jpg";      
          var newTempImage = TempImages.newTempImage(newimageData);
          $scope.tempimages.push(newTempImage);
          TempImages.save($scope.tempimages);  
          console.log(newTempImage)
          if (Projects.getLastActiveModal() == 'editTaskModal')
          {
            $scope.updateTask($scope.activeTask);
          }
        },
        function (error)
          {
            console.log(error);
          }
        );
    }, function(err) {
      // An error occured. Show a message to the user
      console.log("nothing error works")
    });

  }

  $scope.openPhotoLibrary2 = function(task) {

    var myFileName = Math.floor(Date.now());
    var pathToFolder = "";
    if ($scope.currentPlatform == "android") {
      pathToFolder = cordova.file.externalDataDirectory;
    }
    else if ($scope.currentPlatform == "ios") {
      // pathToFolder = cordova.file.syncedDataDirectory;
      pathToFolder = cordova.file.applicationStorageDirectory + "Library/Cloud/"
      // console.log(pathToFolder)
    }

    window.imagePicker.getPictures(
        function(results) {
            for (var i = 0; i < results.length; i++) {
                console.log('Image URI: ' + results[i]);
                // var filename = results[i].replace(/^.*[\\\/]/, '')
                results[i] = decodeURIComponent(results[i])
                $cordovaFileTransfer.download(results[i], pathToFolder + results[i].replace(/^.*[\\\/]/, '').replace(/ /g,'_'), {}, true).then(
                function(fileEntry)
                {
                  // var newimageData = fileEntry.nativeURL;
                  console.log(fileEntry.nativeURL)
                  var appleFileName = fileEntry.nativeURL.replace(/^.*[\\\/]/, '')
                  var newimageData;
                  if ($scope.currentPlatform == "android") newimageData = fileEntry.nativeURL;
                  if ($scope.currentPlatform == "ios") newimageData = "Library/Cloud/" + appleFileName;      
                  var newTempImage = TempImages.newTempImage(newimageData);
                  $scope.tempimages.push(newTempImage);
                  TempImages.save($scope.tempimages);  
                  console.log(newTempImage)
                  if (Projects.getLastActiveModal() == 'editTaskModal')
                  {
                    $scope.updateTask($scope.activeTask);
                  }
                });
            }
        }, function (error) {
            console.log('Error: ' + error);
        }, {
            maximumImagesCount: 8,
            width: 1024
        }
    );

  }

  $scope.removeImage = function(the_path, imageindex, task) {
    $scope.showConfirm('Remove Picture', 'This picture would be permanently removed', function() {
     if ($scope.currentPlatform == "ios" || $scope.currentPlatform == "android") {
      window.resolveLocalFileSystemURL(the_path, function (result) {
          result.remove(function(){
          });    
        });   
     }   
    var taskIndex = $scope.findTaskIndex($scope.activeProject.tasks, task.id);
    // $scope.activeProject.tasks[taskIndex] = task;    
    // $scope.activeProject.tasks[taskIndex].images.splice(imageindex,1); 
    $scope.activeTask.images.splice(imageindex,1);
    console.log($scope.activeProject.tasks[taskIndex].images);
    Projects.save($scope.projects);
    // $ionicScrollDelegate.scrollBy(0,0,true);
    $scope.closePopupImageModal('editTaskModal')
    })
  };

  $scope.removeOneNewImage = function(the_path, index) {
    $scope.showConfirm('Remove Picture', 'This picture would be permanently removed', function() {
      console.log(the_path)
      $scope.tempimages.splice(index,1)
      TempImages.save($scope.tempimages)
      $scope.tempimages = TempImages.all()
      if ($scope.currentPlatform == "ios" || $scope.currentPlatform == "android") {    
        window.resolveLocalFileSystemURL(the_path, function (result) {
          result.remove(function(){
          });    
        });   
      }
      // $ionicScrollDelegate.scrollBy(0,0,true);
      $scope.closePopupTempImageModal('editTaskModal')
    })
  };    

  $scope.removeQueueImage = function(the_path) {
    if ($scope.currentPlatform !== "win32") {  
      if ($scope.currentPlatform == 'ios')  the_path = $scope.uuidPath + the_path
        if ($scope.currentPlatform == "ios" || $scope.currentPlatform == "android") {  
          window.resolveLocalFileSystemURL(the_path, function (result) {
            result.remove(function(){
            });    
          });  
        }
    }
  }; 

  $scope.createCustomProject = function(projectTitle) {
    if (document.getElementById("createproject")) document.getElementById("createproject").disabled=true;
    if (!projectTitle || projectTitle == "" || projectTitle == null)
    {
      $scope.closeNewProject()
      return;
    }
    var projectTemplate = $scope.projectTemplate;
    var projectCategory = $scope.projectCategory;
    var projectCode = $scope.projectCode;
    var newProject = Projects.newProject(projectTitle, projectTemplate, projectCategory, projectCode);
    var pathToBackup = "";
    $scope.projects.push(newProject);
    console.log(newProject)

    //https://jsonblob.com/580c4437e4b0bcac9f8360e9
    //http://lowcost-env.gyqn3pie8x.us-west-2.elasticbeanstalk.com/jsonblob.txt
    //http://bit.ly/2edt2aI

    // pathToBackup = "https://jsonblob.com/api/jsonblob/580c4437e4b0bcac9f8360e9"
    // if ($scope.currentPlatform == "android") pathToBackup = cordova.file.externalDataDirectory + 'jsontemplatedata.txt'; 
    // if ($scope.currentPlatform == "ios") pathToBackup = cordova.file.applicationStorageDirectory + 'Library/Cloud/' + 'jsontemplatedata.txt';  

    $scope.customProjects = TempProjects.all();
    //overwrite
    $scope.customProjects = [];

    $scope.activeProject = $scope.projects[$scope.projects.length-1]
    Projects.setLastActiveIndex($scope.projects.length-1)
    $scope.myLastActiveIndex = $scope.projects.length-1

    if (projectTemplate)
    {
      for(var i=0;i<$scope.customProjects.length;i++) {
        if ($scope.customProjects[i].project == projectTemplate) {
          for(var j=0; j<$scope.customProjects[i].titles.length; j++) {
            $scope.activeProject.tasks.push({
              id : Projects.getNextKeyValue(),
              code: $scope.customProjects[i].titles[j].code,
              topic: $scope.customProjects[i].titles[j].topic,
              description: $scope.customProjects[i].titles[j].description,
              title: $scope.customProjects[i].titles[j].title,
              origin: 'template',
              infographic: $scope.customProjects[i].titles[j].infographic,
              data: $scope.customProjects[i].titles[j].data,
              type: $scope.customProjects[i].titles[j].type,
              isDone: 'NO',
              createDate: (new Date()).toISOString(),
              images: $scope.customProjects[i].titles[j].images,
              unit: 1,
              pricePerUnit: 0
            });      
          }
        }
      } 
    }

    Projects.save($scope.projects)
    $scope.closeNewProject();
    $scope.propertiesHidden = false;
    $ionicScrollDelegate.$getByHandle('.cardmenuproject').scrollBottom();
    if ($scope.currentPlatform == "android" || $scope.currentPlatform == "ios") $cordovaToast.showShortCenter("Folder " + projectTitle + " has been created") 

  } 


  $scope.getProjectTemplates = function() {
    var pathToBackup = ""
    pathToBackup = "https://jsonblob.com/api/jsonblob/580c4437e4b0bcac9f8360e9"
    // if ($scope.currentPlatform == "android") pathToBackup = cordova.file.externalDataDirectory + 'jsontemplatedata.txt';
    // if ($scope.currentPlatform == "ios") pathToBackup = cordova.file.applicationStorageDirectory + 'Library/Cloud/' + 'jsontemplatedata.txt';    
    if ($scope.currentPlatform == "android" || $scope.currentPlatform == "ios") pathToBackup = "https://s3-ap-southeast-1.amazonaws.com/needmeinfographic/NeedMeJson.txt?dt=" + new Date().getTime()
    console.log(pathToBackup)

    var request = $http.get(pathToBackup)
    .success(function (latestProjects) {
      return latestProjects
    });

    request.then(function (result) { 
      TempProjects.save(result.data)
    });
  }  

  $scope.syncFolder = function() {
    if (!$scope.activeProject.code)
    {
      console.log("no project code")
      $scope.$broadcast('scroll.refreshComplete'); 
      return
    }
    $scope.getProjectTemplates()
    // $scope.loopTitle = false;
    var localData = [];
    var cloudData = [];
    var difference = [];

    $timeout( function() {

      $scope.customProjects = TempProjects.all();

      for(var i=0;i<$scope.customProjects.length;i++) 
      {
        if ($scope.customProjects[i].code == $scope.activeProject.code)
        {
          for(var j=0; j<$scope.customProjects[i].titles.length; j++)
          {
            cloudData.push($scope.customProjects[i].titles[j].code)
          }
          $scope.folderToSync = $scope.customProjects[i];
          break;
        }
      }

      for(var i=0; i<$scope.activeProject.tasks.length; i++) 
      {
        if ($scope.activeProject.tasks[i].code && $scope.activeProject.tasks[i].code !== "" && $scope.activeProject.tasks[i].code !== undefined)
        {
          localData.push($scope.activeProject.tasks[i].code)
        }
        else
        {
          if ($scope.currentPlatform == "ios" || $scope.currentPlatform == "android") $cordovaToast.showShortCenter("You may encounter duplicates after syncing. Just manually delete the older ones");
        }
      }

      jQuery.grep(cloudData, function(el) 
        {
          if ($.inArray(el, localData) == -1) 
            {
              difference.push(el);
            }
        });
      console.log(difference)

      for (i=0; i<$scope.folderToSync.titles.length; i++)
      {
        if (arrayContainsString(difference,$scope.folderToSync.titles[i].code))
        {
          $scope.activeProject.tasks.unshift({
            id : Projects.getNextKeyValue(),
            code: $scope.folderToSync.titles[i].code,
            topic: $scope.folderToSync.titles[i].topic,
            description: $scope.folderToSync.titles[i].description,
            title: $scope.folderToSync.titles[i].title,
            origin: 'template',
            infographic: $scope.folderToSync.titles[i].infographic,
            data: $scope.folderToSync.titles[i].data,
            type: $scope.folderToSync.titles[i].type,
            isDone: 'NO',
            createDate: (new Date()).toISOString(),
            images: $scope.folderToSync.titles[i].images,
            unit: 1,
            pricePerUnit: 0
          });   
        }
      }

      console.log(localData)
      console.log(cloudData)
      console.log(difference)
      Projects.save($scope.projects)

    }, 1000 ) // end of timeout

    $ionicLoading.show({
      template: '<ion-spinner></ion-spinner>' + 'Syncing ...'
    });

    $timeout( function() {
      //Stop the ion-refresher from spinning
      $scope.$broadcast('scroll.refreshComplete'); 
      $ionicLoading.hide();
    }, 2000);

  }

  $scope.selectProjectTemplate = function (projectTemplate, projectCategory, projectCode) {
    $scope.projectTemplate = projectTemplate;
    $scope.projectCategory = projectCategory;
    $scope.projectCode = projectCode;
    console.log($scope.projectCode)
  }

  $scope.createJsonBackup = function () {

    var jsonBackupString = Projects.all();
    // console.log(JSON.parse(jsonBackupString))
    var jsonKeyValue = Projects.getKeyValue();
    var pathToBackup = "";
    if ($scope.currentPlatform == "android") pathToBackup = cordova.file.externalDataDirectory;
    // if ($scope.currentPlatform == "ios") pathToBackup = cordova.file.syncedDataDirectory;
    if ($scope.currentPlatform == "ios") pathToBackup = cordova.file.applicationStorageDirectory + "Library/Cloud/"

    $cordovaFile.createFile(pathToBackup, "jsondb.txt", true)
      .then(function (success) {
        // success
      }, function (error) {
        console.log(error);
      });
    $cordovaFile.createFile(pathToBackup, "jsonkeyvalue.txt", true)
      .then(function (success) {
        // success
      }, function (error) {
        console.log(error);
      });          
    $cordovaFile.writeFile(pathToBackup, "jsondb.txt", JSON.stringify(jsonBackupString), true)
      .then(function (success) {
        // success
        if ($scope.currentPlatform == "android" || $scope.currentPlatform == "ios") $cordovaToast.showShortCenter("Your data are backed up locally.");
      }, function (error) {
        console.log(error);
      });
    $cordovaFile.writeFile(pathToBackup, "jsonkeyvalue.txt", jsonKeyValue, true)
      .then(function (success) {
        // success
        // if ($scope.currentPlatform == "android" || $scope.currentPlatform == "ios") $cordovaToast.showShortCenter("Your key value is backed up locally");
      }, function (error) {
        console.log(error);
      });           
  }

  $scope.restoreJsonBackup = function () {
    var pathToBackup = ""
    if ($scope.currentPlatform == "android") pathToBackup = cordova.file.externalDataDirectory;
    // if ($scope.currentPlatform == "ios") pathToBackup = cordova.file.syncedDataDirectory;  
    if ($scope.currentPlatform == "ios") pathToBackup = cordova.file.applicationStorageDirectory + "Library/Cloud/"   
    $http.get(pathToBackup + 'jsondb.txt')
    .success(function (data) {
        // console.log(JSON.parse(data))
        Projects.save(data);
        $scope.projects = Projects.all();
        $scope.activeProject = $scope.projects[Projects.getLastActiveIndex()]
        // console.log($scope.projects)
        if ($scope.currentPlatform == "android" || $scope.currentPlatform == "ios") $cordovaToast.showShortCenter("Your last known backup has been restored.");
    }); 

    $http.get(pathToBackup + 'jsonkeyvalue.txt')
    .success(function (data) {
      Projects.setKeyValue(data)
    }); 
  }

  $scope.refreshBackup = function () {
    $scope.projects = Projects.all();
    // $scope.
    $scope.activeProject = $scope.projects[Projects.getLastActiveIndex()]
  }

  // Make sure to persist the change after is done is toggled
  $scope.doneClicked = function(task) {
    $scope.activeProject = $scope.projects[Projects.getLastActiveIndex()]
    var taskIndex = $scope.findTaskIndex($scope.activeProject.tasks, task.id);
    // if (taskIndex < 0) {return;}
    console.log(taskIndex)
    var currentisDone = $scope.activeProject.tasks[taskIndex].isDone;
    dateDone = (new Date()).toISOString()
    if (!$scope.activeProject || !task) {
      return;
    }
    if (currentisDone == "NO") 
      {
        // $scope.task.isDone = dateDone
        $scope.activeProject.tasks[taskIndex].isDone = dateDone; 
        var moved = $scope.activeProject.tasks.splice(taskIndex, 1);
        $scope.activeProject.tasks.splice($scope.activeProject.tasks.length, 0, moved[0]);        
        if ($scope.currentPlatform == "android" || $scope.currentPlatform == "ios") $cordovaToast.showShortCenter('Note moved to Completed')
      }
    else
      {
        // $scope.task.isDone = "NO"
        $scope.activeProject.tasks[taskIndex].isDone = "NO";   
        var moved = $scope.activeProject.tasks.splice(taskIndex, 1);
        $scope.activeProject.tasks.splice(0, 0, moved[0]);              
        if ($scope.currentPlatform == "android" || $scope.currentPlatform == "ios") $cordovaToast.showShortCenter('Note restored')    
      }
    console.log($scope.activeProject)
    Projects.save($scope.projects);
  }

  $scope.downloadCloudData = function() {
    //https://jsonplaceholder.typicode.com/users
    $http.get('https://jsonplaceholder.typicode.com/users').
        success(function(data) {
            $scope.cloudResponse = data;
            console.log($scope.cloudResponse)
        });
    if ($scope.currentPlatform == "android" || $scope.currentPlatform == "ios") $cordovaToast.showShortCenter('No function for this')        
  }

  $scope.uploadCloudData = function() {
    var link = 'http://localhost:80/send-email.php';
    $http.post(link, {username : "benny", lastname : "lim"}).then(function (res)
    {
      $scope.cloudResponse = res.data;
      console.log($scope.cloudResponse)
    });    
  }

  $scope.sendByEmail = function() {
    console.log($scope.activeProject.title);
    console.log($scope.activeProject.tasks.length);
    for(var i=0;i<$scope.activeProject.tasks.length;i++) {
      console.log($scope.activeProject.tasks[i].title)
    }      
    var message = "<b>hello</b>";
    var subject = "subject me";
    var toArr = ["pershingventure@gmail.com"];
    var ccArr = [];
    var bccArr = [];
    var file = null;
    // $cordovaSocialSharing
    //   .shareViaEmail(message, subject, toArr, ccArr, bccArr, file)
    //   .then(function(result) {
    //     // Success! 
    //   }, function(err) {
    //     // An error occurred. Show a message to the user
    //   });  
  }  


  $scope.findContactsBySearchTerm = function (searchTerm) {
    if (searchTerm !== null && searchTerm !== "")
    {
      var opts = {                                   //search options
        filter : searchTerm,                         // 'Bob'
        multiple: true,                              // Yes, return any contact that matches criteria
        fields:  [ 'displayName' ]                   // These are the fields to search for 'bob'.
      };

      if ($scope.currentPlatform == "android") {
        opts.hasPhoneNumber = true;                  //hasPhoneNumber only works for android.
      };

      $cordovaContacts.find(opts).then(function (contactsFound) {
        $scope.contacts = contactsFound;
        console.log(contactsFound);
      });
    }
    else
    {
      $scope.contacts = [];
    }
  }

  $scope.addCollaborator = function (emailAddress) {

    var pattern = /^([a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.[a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)*|"((([ \t]*\r\n)?[ \t]+)?([\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*(([ \t]*\r\n)?[ \t]+)?")@(([a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.)+([a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.?$/i;
    emailAddress = emailAddress.toLowerCase();

    if (pattern.test(emailAddress))
    {
      var matchEmailCount = 0;
      
      if (!$scope.activeProject.collaborators) {
        $scope.activeProject.collaborators = []; 
      }
      for(var i=0;i<$scope.activeProject.collaborators.length;i++) {
        if ($scope.activeProject.collaborators[i].email == emailAddress) {
          matchEmailCount = matchEmailCount + 1;
        }
      }
      if (matchEmailCount == 0) {
        $scope.activeProject.collaborators.push ({
          email: emailAddress
        });
        console.log($scope.activeProject.collaborators)
        if ($scope.currentPlatform == "android" || $scope.currentPlatform == "ios") $cordovaToast.showShortCenter(emailAddress + ' has been added')     
      }
      else {
        if ($scope.currentPlatform == "android" || $scope.currentPlatform == "ios") $cordovaToast.showShortCenter('Email has already been added')       
      }
      // console.log($scope.activeProject)
      Projects.save($scope.projects);
      $scope.activeProject = $scope.projects[Projects.getLastActiveIndex()];
    }
    else
    {
      if ($scope.currentPlatform == "android" || $scope.currentPlatform == "ios") $cordovaToast.showShortCenter('Email not valid')
    }

    var input = $('#newEmail');
    input.val('');

  }

  $scope.emailExist = function (emailAddress) {
    var matchEmailCount = 0
    emailAddress = emailAddress.toLowerCase()
    $scope.activeProject = $scope.projects[Projects.getLastActiveIndex()];
    if (!$scope.activeProject.collaborators) {
      $scope.activeProject.collaborators = []; 
    }    
    for(var i=0;i<$scope.activeProject.collaborators.length;i++) {
      if ($scope.activeProject.collaborators[i].email == emailAddress) {
        matchEmailCount = matchEmailCount + 1;
      }
    }
    if (matchEmailCount > 0) {     
      return true
    }
    else {
      return false
    }
  }

  $scope.removeCollaborator = function (emailAddress) {
    for(var i=0;i<$scope.activeProject.collaborators.length;i++) {
      if ($scope.activeProject.collaborators[i].email == emailAddress) {
        // matchEmailCount = matchEmailCount + 1;
        $scope.activeProject.collaborators.splice(i, 1);
        Projects.save($scope.projects);
        $scope.activeProject = $scope.projects[Projects.getLastActiveIndex()];        
        if ($scope.currentPlatform == "android" || $scope.currentPlatform == "ios") $cordovaToast.showShortCenter(emailAddress + ' has been removed')        
      }
    }
  }

  $scope.openDatePicker = function(){
    var taskDate = {
      callback: function (val) {
        var myDateString = new Date(val).toDateString()
        $scope.task.dueDate = myDateString
        if (Projects.getLastActiveModal() == "editTaskModal") $scope.updateTaskAuto($scope.task)
      }, inputDate: new Date()
    };    
    ionicDatePicker.openDatePicker(taskDate);
  };  

  $scope.openTimePicker = function(){
    var myInputTime = 0;
    if ((new Date()).getHours() !== 23)
    {
      myInputTime = (((new Date()).getHours() * 60 * 60) + (60 * 60));
    }
    var taskTime = {
      callback: function (val) {
        if (typeof (val) === 'undefined') {
          console.log('Time not selected');
        } else {
          var selectedTime = new Date(val * 1000);
          // var testAppleTime = new Date((new Date().getTime() + 28800*1000)).getUTCHours()
          // console.log(testAppleTime)
          var myTimeString = formatTime(addZero(selectedTime.getUTCHours()),addZero(selectedTime.getUTCMinutes()))
          var myDateString
          $scope.task.dueTime = myTimeString
          if ($scope.task.dueDate !== null && new Date($scope.task.dueDate + ',' + myTimeString) < new Date())
          {
            $scope.task.dueDate = null
          }
          if ($scope.task.dueDate == null)
          {
            myDateString = new Date().toDateString()
            if (new Date(myDateString + ',' + myTimeString) < new Date())
            {
              var today = new Date()
              var tomorrow = today.setDate(today.getDate() + 1)
              myDateString = new Date(tomorrow).toDateString()
            }
            $scope.task.dueDate = myDateString
          }
          if (Projects.getLastActiveModal() == "editTaskModal") $scope.updateTaskAuto($scope.task)
        }
      }, inputTime: myInputTime
      // }, inputTime: (((new Date()).getHours() * 60 * 60) + (60 * 60))
    };
    ionicTimePicker.openTimePicker(taskTime);
  };

  $scope.removeDateTime = function(){
    $scope.task.dueDate = null
    $scope.task.dueTime = null
    if (Projects.getLastActiveModal() == "editTaskModal") $scope.updateTaskAuto($scope.task)
    if ($scope.currentPlatform == "android" || $scope.currentPlatform == "ios") $scope.cancelLocalNotification($scope.task.id)
  }

  $scope.addLocalNotification = function(taskId, projectTitle, taskTitle, alarmTime) {
      // var alarmTime = new Date();
      // alarmTime.setMinutes(alarmTime.getMinutes() + 2);
      if (alarmTime)
      {
        $cordovaLocalNotification.add({
            id: taskId,
            at: alarmTime,
            text: taskTitle,
            title: projectTitle,
            icon: "file://img/icon.png",
            sound: "res://platform_default",
            led: "FFFF00",
            data: ""
        }).then(function () {
            console.log(alarmTime)
            $scope.getScheduledTaskIds()
        });
      }
  };

  $scope.cancelLocalNotification = function(taskId) {
    $cordovaLocalNotification.cancel(taskId).then(function () {
            console.log("cancel")
            $scope.getScheduledTaskIds()
      });

  }

  $scope.cancelAllLocalNotifications = function() {
    $cordovaLocalNotification.cancelAll().then(function () {
            console.log("cancelAll")
      });

  }  
 
  $scope.getScheduledTaskIds = function() {
    $cordovaLocalNotification.getScheduledIds().then(function(scheduleIds) {
    });   
  } 

  $scope.getUpcomingEvents = function() {
    $cordovaLocalNotification.getScheduledIds().then(function(scheduleIds) {
      $scope.upcomingList = []
      $scope.upcomingEventSources = []
      console.log(scheduleIds)
      // console.log($scope.projects)
      var calendarTitle = ""
      for(var i=0;i<$scope.projects.length;i++)
      {
        for(var j=0;j<$scope.projects[i].tasks.length;j++)  
        {
            if (arrayContainsString(scheduleIds,$scope.projects[i].tasks[j].id))
            {
              if (!$scope.projects[i].tasks[j].dueTime) $scope.projects[i].tasks[j].dueTime = "05:00:00 PM"
              $scope.upcomingList.push ({
                projectIndex: i,
                projectTitle: $scope.projects[i].title,
                taskTopic: $scope.projects[i].tasks[j].topic,
                taskId: $scope.projects[i].tasks[j].id,
                taskTitle: $scope.projects[i].tasks[j].title,
                myAlarmTime: (new Date($scope.projects[i].tasks[j].dueDate + ' ' + $scope.projects[i].tasks[j].dueTime)).toISOString()
              });
              $scope.projects[i].tasks[j].topic ? calendarTitle = $scope.projects[i].tasks[j].topic : calendarTitle = $scope.projects[i].tasks[j].title
              $scope.upcomingEventSources.push ({
                title: calendarTitle,
                start: new Date($scope.projects[i].tasks[j].dueDate + ' ' + $scope.projects[i].tasks[j].dueTime),
                allDay: true
              })          
            }
        }
      }  
      // console.log($scope.upcomingEventSources) 
    });   
  }  

  $scope.getNearestUpcoming = function() {
    $cordovaLocalNotification.getScheduledIds().then(function(scheduleIds) {  
      var scheduleTaskId = parseInt(scheduleIds[0])
      // console.log(scheduleTaskId)
      
      var alarmTime = new Date();
      alarmTime.setYear(2200);  
      $scope.nearestTimePlaceholder = new Date(alarmTime);  
      // console.log($scope.nearestTimePlaceholder)  
      cordova.plugins.backgroundMode.setDefaults({ 
        title:  'NeedMe',
        text: 'No reminder',
        ticker: 'NeedMe',      
        resume: true,
        isPublic: true
      });
      if (scheduleIds[0])
      {
        // console.log(scheduleIds)
        for(var i=0;i<$scope.projects.length;i++)
        {
          for(var j=0;j<$scope.projects[i].tasks.length;j++)  
          {
            if (arrayContainsString(scheduleIds,$scope.projects[i].tasks[j].id))
            {
              // console.log("matches" + $scope.projects[i].tasks[j].id)
              var statusProjectTitle = 'NEXT: ' + $scope.projects[i].title;
              var statusTaskTitle = $scope.projects[i].tasks[j].title;
              if ($scope.projects[i].tasks[j].topic) statusTaskTitle = $scope.projects[i].tasks[j].topic
              $scope.statusNearestTime = new Date($scope.projects[i].tasks[j].dueDate + ', ' + $scope.projects[i].tasks[j].dueTime)
              if ($scope.nearestTimePlaceholder >= $scope.statusNearestTime)
              {
                cordova.plugins.backgroundMode.configure({
                  title:  statusProjectTitle,
                  text: statusTaskTitle,
                  ticker: statusProjectTitle,
                  resume: true,
                  isPublic: true
                });
                $scope.nearestTimePlaceholder = $scope.statusNearestTime                
              }
              // break;         
            }
          }
        }  
      }
    });
  } 

  $scope.getTaskByTaskId = function(taskId) {
    var selectedProject = ""
    var selectedProjectIndex = ""
    var selectedTaskIndex = ""
    var selectedTask = ""

    for(var j=0;j<$scope.projects.length;j++)
    {
      for (var k=0;k<$scope.projects[j].tasks.length;k++)
      {
        if ($scope.projects[j].tasks[k].id == taskId) {
          console.log("matched")
          selectedProjectIndex = j
          selectedTaskIndex = k
          selectedProject = $scope.projects[j]
          selectedTask = $scope.projects[j].tasks[k]
          break
        }
      }
      if (selectedProjectIndex !== "") break
    }

    if ($scope.projects[selectedProjectIndex].hasOwnProperty('protect') && $scope.projects[selectedProjectIndex].protect == "true")
    {
      $cordovaTouchID.checkSupport().then(function() {
        // success, TouchID supported
        $cordovaTouchID.authenticate("Unlock with your fingerprint").then(function() {
          // successful authentication
          $scope.prepareNotificationTask(selectedTask, selectedProjectIndex, selectedTaskIndex)
        }, function () {
          // error authenticating
          if ($scope.currentPlatform == "android" || $scope.currentPlatform == "ios") $cordovaToast.showShortCenter("Authentication failed") 
        });
      }, function (error) {
        // TouchID not supported
        $scope.prepareNotificationTask(selectedTask, selectedProjectIndex, selectedTaskIndex)
      });
    }
    else
    {
      $scope.prepareNotificationTask(selectedTask, selectedProjectIndex, selectedTaskIndex)
    }
  }


  $scope.prepareNotificationTask = function(selectedTask, selectedProjectIndex, selectedTaskIndex){
    var myLastActiveModal = Projects.getLastActiveModal()

    // if ($ionicSideMenuDelegate.isOpenLeft()) $ionicSideMenuDelegate.toggleLeft()

    if (myLastActiveModal == "gallery-zoomview") 
      {
        $scope.PopupImageModal.hide()
        if ($ionicSideMenuDelegate.isOpenLeft()) $ionicSideMenuDelegate.toggleLeft()
      }
    if (myLastActiveModal == "gallery-zoomview-temp") 
      {
        $scope.PopupImageModal.hide()
        $scope.taskModal.hide()
        if ($ionicSideMenuDelegate.isOpenLeft()) $ionicSideMenuDelegate.toggleLeft()
      }
    if (myLastActiveModal == "newCollaboratorModal") 
      {
        $scope.newCollaboratorModal.hide()
        $scope.editProjectModal.hide()
        if ($ionicSideMenuDelegate.isOpenLeft()) $ionicSideMenuDelegate.toggleLeft()
      }
    if (myLastActiveModal == "editSettingModal")
      {
        $scope.editSettingModal.hide()
        if ($ionicSideMenuDelegate.isOpenLeft()) $ionicSideMenuDelegate.toggleLeft()
      } 
    if (myLastActiveModal == "editProjectModal")
      {
        $scope.editProjectModal.hide()
        if ($ionicSideMenuDelegate.isOpenLeft()) $ionicSideMenuDelegate.toggleLeft()
      }
    if (myLastActiveModal == "newProjectModal") 
      {
        $scope.newProjectModal.hide()
        if ($ionicSideMenuDelegate.isOpenLeft()) $ionicSideMenuDelegate.toggleLeft()
      }
    if (myLastActiveModal == "taskModal")
      {
        $scope.taskModal.hide()
        if ($ionicSideMenuDelegate.isOpenLeft()) $ionicSideMenuDelegate.toggleLeft()
      }
    if (myLastActiveModal == "accomplishmentModal") 
      {
        $scope.accomplishmentModal.hide()
        if ($ionicSideMenuDelegate.isOpenLeft()) $ionicSideMenuDelegate.toggleLeft()
      }
    if (myLastActiveModal == "upcomingModal") 
      {
        $scope.upcomingModal.hide()
        if ($ionicSideMenuDelegate.isOpenLeft()) $ionicSideMenuDelegate.toggleLeft()
      }
    if (myLastActiveModal == "placesModal") 
      {
        $scope.placesModal.hide()
        $scope.taskModal.hide()
        if ($ionicSideMenuDelegate.isOpenLeft()) $ionicSideMenuDelegate.toggleLeft()
      }
    if (myLastActiveModal == "calendarModal") 
      {
        $scope.calendarModal.hide()
        if ($ionicSideMenuDelegate.isOpenLeft()) $ionicSideMenuDelegate.toggleLeft()
      }    
    // if (myLastActiveModal == "editTaskModal") $scope.editTaskModal.hide()
    
    Projects.setLastActiveIndex(selectedProjectIndex)
    Projects.setLastTaskIndex(selectedTaskIndex) 
    $scope.activeProject = $scope.projects[selectedProjectIndex]
    $scope.getTabIndex()
    console.log(Projects.getLastActiveIndex()) 
    console.log(Projects.getLastTaskIndex())

    $scope.editTask(selectedTask, "", selectedProjectIndex)
  }


  $scope.getAccomplishment = function() {
    $scope.accomplishmentList = []
    for(var i=0;i<$scope.projects.length;i++)
    {
      for(var j=0;j<$scope.projects[i].tasks.length;j++)
      {
        if ($scope.projects[i].tasks[j].isDone !== "NO" && $scope.projects[i].tasks[j].isDone !== "YES")
          //filter YES to differentiate prior situation where isDone is not a date
        {
          $scope.accomplishmentList.push ({
            projectIndex: i,
            projectTitle: $scope.projects[i].title,
            projectCategory: $scope.projects[i].category || '',
            taskTopic: $scope.projects[i].tasks[j].topic,
            taskTitle: $scope.projects[i].tasks[j].title,
            taskId: $scope.projects[i].tasks[j].id,
            isDone: $scope.projects[i].tasks[j].isDone
          });       
        }
      }
    }
    var activeHealthDate = Projects.getActiveHealthDate();
    if (activeHealthDate != 0)
    {
      $scope.accomplishmentList.push ({
        projectIndex: '0',
        projectTitle: 'Walking Target',
        projectCategory: 'Health',
        taskTitle: 'Achieved active lifestyle, beating daily average',
        taskId: '-1',
        isDone: activeHealthDate
      });         
    }
  } 

  $scope.restoreTask = function(taskId) {
    for(var i=0;i<$scope.projects.length;i++)
    {
      for(var j=0;j<$scope.projects[i].tasks.length;j++)
      {
        if ($scope.projects[i].tasks[j].id == taskId)
        {
          $scope.projects[i].tasks[j].isDone = 'NO'
          var moved = $scope.projects[i].tasks.splice(j, 1);
          $scope.projects[i].tasks.splice(0, 0, moved[0]);          
        }
      }
    }   
    $scope.getAccomplishment(); 
    Projects.save($scope.projects)
  }

  $scope.rearrangeAllTasks = function() {
    for(var i=0;i<$scope.projects.length;i++)
    {
      $scope.newlyArrangedTasks = [];
      $scope.openTaskList = [];
      $scope.closedTaskList = [];      
      for(var j=0;j<$scope.projects[i].tasks.length;j++)
      {
        if ($scope.projects[i].tasks[j].isDone == 'NO')
        {
          $scope.openTaskList.push($scope.projects[i].tasks[j])
        }
        else
        {
          $scope.closedTaskList.push($scope.projects[i].tasks[j])
        }
      }
      // console.log($scope.openTaskList)
      for(var k=0;k<$scope.openTaskList.length;k++)
      {
        $scope.newlyArrangedTasks.push($scope.openTaskList[k])
      }
      for(var l=0;l<$scope.closedTaskList.length;l++)
      {
        $scope.newlyArrangedTasks.push($scope.closedTaskList[l])
      }      
      $scope.projects[i].tasks = $scope.newlyArrangedTasks
      // console.log($scope.projects[i].tasks)
    }   
    Projects.save($scope.projects)
  }  

  $scope.filterByDate = function(accomplishment) {
    var today = new Date()
    // console.log(today)
    $scope.dateFilter = Projects.getAccomplishmentDays()
    $scope.newDate = new Date(today.setDate(today.getDate() - parseInt($scope.dateFilter)))    
    return new Date(accomplishment.isDone) >= $scope.newDate //&& accomplishment.projectCategory !== 'checklist'
    // return new Date((new Date(accomplishment.isDone)).toLocaleString()) >= $scope.newDate
  }  

  $scope.upcomingByDate = function(upcoming) {
    var futureDate = new Date();
    $scope.upcomingFilter = Projects.getUpcomingDays();
    futureDate.setDate(futureDate.getDate() + parseInt($scope.upcomingFilter));  
    return new Date(upcoming.myAlarmTime) <= futureDate
  }   

  $scope.filterByIncomplete = function(activeProjectTasks) {
    //TODO: will not filter if project type is Reno?
    return activeProjectTasks.isDone == 'NO';
  }  

  $scope.filterByCompleted = function(activeProjectTasks) {
    return activeProjectTasks.isDone !== 'NO';
  }    

  $scope.refreshAccomplistmentList = function(daysAgo) {
    Projects.setAccomplishmentDays(daysAgo)
  } 

  $scope.refreshUpcomingList = function(daysAgo) {
    Projects.setUpcomingDays(daysAgo)
  }   

  $scope.previewTaggedData = function(){
    $timeout(function () {
      $scope.urlList = []
      $scope.gpsAddressList = []
      $scope.urlList = findUrls($scope.task.title)
      $scope.gpsAddressList = findGPS($scope.task.title)
      console.log("pasted" + $scope.task.title)
    }, 100);
  }

  $scope.getCurrentLocation = function(){
    if ($scope.currentPlatform == "android" || $scope.currentPlatform == "ios") $cordovaToast.showShortCenter("Ensure good internet speed and Location turned on. Wait for 3 seconds.")        
    var posOptions = {timeout: 3000, enableHighAccuracy: true};
    $cordovaGeolocation
      .getCurrentPosition(posOptions)
      .then(function (position) {
        var lat  = position.coords.latitude
        var long = position.coords.longitude
        var gpsMessage = lat + ',' + long + ' '
        // var geoCode = "http://maps.googleapis.com/maps/api/geocode/json?latlng=" + gpsMessage + "&sensor=true"
        var geoCode = "https://maps.googleapis.com/maps/api/place/search/json?location=" + gpsMessage + "&rankby=distance&sensor=false&key=AIzaSyCptuPPCu6VA-ayYpFx5mA_20Ak4ZGWEkA"
        $http.get(geoCode)
        .success(function (geoCodeResult) {
          TempPlaces.save(geoCodeResult.results)
          $scope.openPlaces()
        });
      },
      function(err) {
        // error
        console.log(err)
        if ($scope.currentPlatform == "android" || $scope.currentPlatform == "ios") $cordovaToast.showLongCenter(err.message + ', retry in a few seconds')
      });
  }

  $scope.getPlaceDetail = function(myPlaceId){
    myDebugPlaceId = "ChIJ___PYtY3zDER-MwOW9od8Co"
    $http.get("https://maps.googleapis.com/maps/api/place/details/json?placeid=" + myPlaceId + "&key=AIzaSyCptuPPCu6VA-ayYpFx5mA_20Ak4ZGWEkA")
      .success(function (geoPlaceResult) {
        if ($scope.task.title == undefined) $scope.task.title = "";
        var placeMessage
        var originalMessage = $scope.task.title
        placeMessage = geoPlaceResult.result.name
        placeMessage = placeMessage + '\n\n' + geoPlaceResult.result.vicinity
        placeMessage = placeMessage + '\n\nGPS: ' + geoPlaceResult.result.geometry.location.lat + ',' + geoPlaceResult.result.geometry.location.lng
        if (geoPlaceResult.result.international_phone_number !== undefined) placeMessage = placeMessage + '\n\n' + geoPlaceResult.result.international_phone_number.replace(/\s+/g, '').replace(/-+/g, '')
        var newTaskMessage = placeMessage + '\n\n' + originalMessage   
        $scope.task.title = newTaskMessage.trim()
        $scope.previewTaggedData($scope.task.title)     
      });  
    $scope.closePlaces();
  }

}) // end of .controller

  