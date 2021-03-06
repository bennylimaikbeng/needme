﻿angular.module('todo.sortable', [])
.directive('sortable', ['$ionicGesture', '$ionicScrollDelegate', function ($ionicGesture, $ionicScrollDelegate) {
    return {
        restrict: 'A',
        scope: {
            draggable: '@',
            sorted: '&'
        },
        link: function (scope, element, attrs) {

            var settings = {
                draggable: scope.draggable ? scope.draggable : '.card',
                duration: 200
            };

            var dragging = null, placeholder = null, offsetY = 0, marginTop = 0;
            var cardSet, initialIndex, currentIndex, animating = false;

            var placeholderHeight;
            var scrollInterval;

            var createPlaceholder = function createPlaceholder(height) {
                // Use marginTop to compensate for extra margin when animating the placeholder
                return $('<div></div>')
                        .css({
                            height: height + 'px',
                            marginTop: (currentIndex > 0 ? -marginTop : -1) + 'px'
                        })
                        .addClass('placeholder');
            };

            var touchHold = function touchHold(e) {
                // Get the element we're about to start dragging
                dragging = angular.element(e.target).closest(settings.draggable);
                if (!dragging.length) dragging = null;

                if (dragging) {
                    // Get the initial index
                    initialIndex = currentIndex = dragging.index(settings.draggable);
                    var position = dragging.position();

                    // Get relative position of touch
                    var clientY = e.gesture.touches[0].clientY;
                    offsetY = clientY - position.top - element.offset().top;

                    // Switch to Absolute position at same location
                    dragging.css({
                        position: 'absolute',
                        zIndex: 1000,
                        left: position.left + 'px',
                        top: position.top + 'px',
                        width: dragging.outerWidth() + 'px'
                    })
                    .addClass('dragging');

                    // Get the set of cards that were re-ordering with
                    cardSet = element.find(settings.draggable + ':not(.dragging)');

                    // We need to know the margin size so we can compensate for having two
                    // margins where we previously had one (due to the placeholder being there)
                    marginTop = parseInt(dragging.css('marginTop')) + 1;

                    // Replace with placeholder (add the margin for when placeholder is full size)
                    placeholderHeight = dragging.outerHeight() + marginTop;
                    placeholder = createPlaceholder(placeholderHeight);
                    placeholder.insertAfter(dragging);

                    // Interval to handle auto-scrolling window when at top or bottom
                    initAutoScroll();
                    scrollInterval = setInterval(autoScroll, 20);
                }
            };
            var holdGesture = $ionicGesture.on('hold', touchHold, element);

            var touchMove = function touchMove(e) {
                if (dragging) {
                    e.stopPropagation();
                    touchY = e.touches ? e.touches[0].clientY : e.clientY;
                    var newTop = touchY - offsetY - element.offset().top;

                    // Reposition the dragged element
                    dragging.css('top', newTop + 'px');

                    // Check for position in the list
                    var newIndex = 0;
                    cardSet.each(function (i) {
                        if (newTop > $(this).position().top) {
                            newIndex = i + 1;
                        }
                    });

                    if (!animating && newIndex !== currentIndex) {
                        currentIndex = newIndex;

                        var oldPlaceholder = placeholder;
                        // Animate in a new placeholder
                        placeholder = createPlaceholder(1);

                        // Put it in the right place
                        if (newIndex < cardSet.length) {
                            placeholder.insertBefore(cardSet.eq(newIndex));
                        } else {
                            placeholder.insertAfter(cardSet.eq(cardSet.length - 1));
                        }

                        // Animate the new placeholder to full height
                        // animating = true;
                        // setTimeout(function () {
                        //     placeholder.css('height', placeholderHeight + 'px');
                        //     // Animate out the old placeholder
                        //     oldPlaceholder.css('height', 1);

                        //     setTimeout(function () {
                        //       oldPlaceholder.remove();
                        //       animating = false;
                        //     }, settings.duration);
                        // }, 50);

                        oldPlaceholder.remove(); //replace above code temp due to placeholder.css is null randomly
                    }
                }
            };

            var touchMoveGesture = $ionicGesture.on('touchmove', touchMove, element);
            var mouseMoveGesture = $ionicGesture.on('mousemove', touchMove, element);

            var touchRelease = function touchRelease(e) {
                if (dragging) {
                    // Set element back to normal
                    dragging.css({
                        position: '',
                        zIndex: '',
                        left: '',
                        top: '',
                        width: ''
                    }).removeClass('dragging');

                    // Remove placeholder
                    placeholder.remove();
                    placeholder = null;

                    if (initialIndex !== currentIndex && scope.sorted) {
                        // Call the callback with the instruction to re-order
                        scope.$fromIndex = initialIndex;
                        scope.$toIndex = currentIndex;
                        scope.$apply(scope.sorted);
                    }
                    dragging = null;

                    clearInterval(scrollInterval);

                    //added by benny
                    $ionicScrollDelegate.scrollBy(0,0,true);
                    //added by benny
                }
            };
            var releaseGesture = $ionicGesture.on('release', touchRelease, element);

            scope.$on('$destroy', function () {
                $ionicGesture.off(holdGesture, 'hold', touchHold);
                $ionicGesture.off(touchMoveGesture, 'touchmove', touchMove);
                $ionicGesture.off(mouseMoveGesture, 'mousemove', touchMove);
                $ionicGesture.off(releaseGesture, 'release', touchRelease);
            });

            var touchY, scrollHeight, containerTop, maxScroll;
            var scrollBorder = 0, scrollSpeed = 0.2;
            // Setup the autoscroll based on the current scroll window size
            var initAutoScroll = function initAutoScroll() {
                touchY = -1;
                var scrollArea = element.closest('.scroll');
                var container = scrollArea.parent();
                scrollHeight = container.height();
                containerTop = container.position().top;
                maxScroll = scrollArea.height() - scrollHeight;
            };

            // Autoscroll function to scroll window up and down when
            // the touch point is close to the top or bottom
            var autoScroll = function autoScroll() {
                var scrollChange = 0;
                if (touchY >= 0 && touchY < containerTop + scrollBorder) {
                    // Should scroll up
                    scrollChange = touchY - (containerTop + scrollBorder);
                } else if (touchY >= 0 && touchY > scrollHeight - scrollBorder) {
                    // Should scroll down
                    scrollChange = touchY - (scrollHeight - scrollBorder);
                }

                if (scrollChange !== 0) {
                    // get the updated scroll position
                    var newScroll = $ionicScrollDelegate.getScrollPosition().top + scrollSpeed * scrollChange;
                    
                    // modified by benny
                    if (scrollChange < 10)
                    {
                        // newScroll = maxScroll*(-1)
                        $ionicScrollDelegate.$getByHandle(settings.draggable).scrollBy(0, scrollChange, false);
                    }
                    else if (scrollChange > 10)
                    {
                        // newScroll = maxScroll;
                        $ionicScrollDelegate.$getByHandle(settings.draggable).scrollBy(0, scrollChange, false);                      
                    }
                    // modified by benny                
                }
            };

        }
    };
}]);
