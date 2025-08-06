// File: js/mobile-drag-drop.js
// Mobile drag and drop polyfill for touch devices

(function() {
    'use strict';

    // Check if we're on a touch device
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    if (!isTouchDevice) {
        return; // Exit if not a touch device
    }

    let dragState = {
        dragging: false,
        dragElement: null,
        startX: 0,
        startY: 0,
        offsetX: 0,
        offsetY: 0,
        dropZone: null,
        ghostElement: null
    };

    // Initialize mobile drag drop
    function initMobileDragDrop() {
        // Add touch events to draggable elements
        document.addEventListener('DOMContentLoaded', function() {
            setupDraggableElements();
            setupDropZones();
        });

        // Re-setup when new elements are added
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes.length) {
                    setupDraggableElements();
                    setupDropZones();
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    function setupDraggableElements() {
        const draggables = document.querySelectorAll('[draggable="true"], .component-item, .section-item, .drag-elements li');
        
        draggables.forEach(function(element) {
            if (element.dataset.mobileDragSetup) return;
            element.dataset.mobileDragSetup = 'true';

            element.addEventListener('touchstart', handleTouchStart, { passive: false });
            element.addEventListener('touchmove', handleTouchMove, { passive: false });
            element.addEventListener('touchend', handleTouchEnd, { passive: false });
        });
    }

    function setupDropZones() {
        const dropZones = document.querySelectorAll('#canvas iframe, .drop-zone, [data-droppable]');
        
        dropZones.forEach(function(zone) {
            if (zone.dataset.mobileDropSetup) return;
            zone.dataset.mobileDropSetup = 'true';
        });
    }

    function handleTouchStart(e) {
        const touch = e.touches[0];
        const element = e.currentTarget;

        // Prevent default to avoid scrolling
        e.preventDefault();

        dragState.dragging = true;
        dragState.dragElement = element;
        dragState.startX = touch.clientX;
        dragState.startY = touch.clientY;

        // Get element position
        const rect = element.getBoundingClientRect();
        dragState.offsetX = touch.clientX - rect.left;
        dragState.offsetY = touch.clientY - rect.top;

        // Create ghost element
        createGhostElement(element, touch.clientX, touch.clientY);

        // Add visual feedback
        element.classList.add('dragging');
        document.body.classList.add('drag-active');

        // Trigger dragstart event
        triggerDragEvent(element, 'dragstart', touch);
    }

    function handleTouchMove(e) {
        if (!dragState.dragging) return;

        const touch = e.touches[0];
        e.preventDefault();

        // Update ghost position
        if (dragState.ghostElement) {
            dragState.ghostElement.style.left = (touch.clientX - dragState.offsetX) + 'px';
            dragState.ghostElement.style.top = (touch.clientY - dragState.offsetY) + 'px';
        }

        // Find drop target
        const dropTarget = findDropTarget(touch.clientX, touch.clientY);
        
        if (dropTarget !== dragState.dropZone) {
            // Handle drag leave
            if (dragState.dropZone) {
                dragState.dropZone.classList.remove('drag-over');
                triggerDragEvent(dragState.dropZone, 'dragleave', touch);
            }

            // Handle drag enter
            if (dropTarget) {
                dropTarget.classList.add('drag-over');
                triggerDragEvent(dropTarget, 'dragenter', touch);
            }

            dragState.dropZone = dropTarget;
        }

        // Trigger dragover
        if (dragState.dropZone) {
            triggerDragEvent(dragState.dropZone, 'dragover', touch);
        }
    }

    function handleTouchEnd(e) {
        if (!dragState.dragging) return;

        const touch = e.changedTouches[0];
        e.preventDefault();

        // Clean up visual states
        if (dragState.dragElement) {
            dragState.dragElement.classList.remove('dragging');
        }
        
        if (dragState.dropZone) {
            dragState.dropZone.classList.remove('drag-over');
        }

        document.body.classList.remove('drag-active');

        // Remove ghost element
        if (dragState.ghostElement) {
            dragState.ghostElement.remove();
            dragState.ghostElement = null;
        }

        // Handle drop
        if (dragState.dropZone) {
            triggerDragEvent(dragState.dropZone, 'drop', touch);
        }

        // Trigger dragend
        if (dragState.dragElement) {
            triggerDragEvent(dragState.dragElement, 'dragend', touch);
        }

        // Reset state
        resetDragState();
    }

    function createGhostElement(original, x, y) {
        const ghost = original.cloneNode(true);
        
        ghost.style.position = 'fixed';
        ghost.style.left = (x - dragState.offsetX) + 'px';
        ghost.style.top = (y - dragState.offsetY) + 'px';
        ghost.style.opacity = '0.7';
        ghost.style.pointerEvents = 'none';
        ghost.style.zIndex = '9999';
        ghost.style.transform = 'rotate(3deg)';
        ghost.classList.add('drag-ghost');

        document.body.appendChild(ghost);
        dragState.ghostElement = ghost;
    }

    function findDropTarget(x, y) {
        // Hide ghost to get accurate elementFromPoint
        const ghostDisplay = dragState.ghostElement ? dragState.ghostElement.style.display : '';
        if (dragState.ghostElement) {
            dragState.ghostElement.style.display = 'none';
        }

        const elementBelow = document.elementFromPoint(x, y);
        
        // Restore ghost
        if (dragState.ghostElement) {
            dragState.ghostElement.style.display = ghostDisplay;
        }

        if (!elementBelow) return null;

        // Find the closest drop zone
        let dropZone = elementBelow.closest('#canvas iframe, .drop-zone, [data-droppable]');
        
        // Special handling for iframe (VvvebJs canvas)
        if (!dropZone) {
            const iframe = document.getElementById('iframe1');
            if (iframe) {
                const iframeRect = iframe.getBoundingClientRect();
                if (x >= iframeRect.left && x <= iframeRect.right && 
                    y >= iframeRect.top && y <= iframeRect.bottom) {
                    dropZone = iframe;
                }
            }
        }

        return dropZone;
    }

    function triggerDragEvent(element, eventType, touch) {
        if (!element) return;

        const event = new DragEvent(eventType, {
            bubbles: true,
            cancelable: true,
            clientX: touch.clientX,
            clientY: touch.clientY
        });

        // Add custom data for VvvebJs compatibility
        if (eventType === 'dragstart' && dragState.dragElement) {
            const dataTransfer = {
                setData: function(type, data) {
                    this._data = this._data || {};
                    this._data[type] = data;
                },
                getData: function(type) {
                    this._data = this._data || {};
                    return this._data[type] || '';
                },
                _data: {}
            };

            Object.defineProperty(event, 'dataTransfer', {
                value: dataTransfer,
                writable: false
            });

            // Set component data for VvvebJs
            if (dragState.dragElement.dataset.component) {
                dataTransfer.setData('text/html', dragState.dragElement.outerHTML);
                dataTransfer.setData('component', dragState.dragElement.dataset.component);
            }
        }

        element.dispatchEvent(event);
    }

    function resetDragState() {
        dragState.dragging = false;
        dragState.dragElement = null;
        dragState.dropZone = null;
        dragState.startX = 0;
        dragState.startY = 0;
        dragState.offsetX = 0;
        dragState.offsetY = 0;
    }

    // Add CSS for mobile drag and drop
    function addMobileStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Mobile drag and drop styles */
            .drag-active {
                user-select: none;
                -webkit-user-select: none;
            }

            .dragging {
                opacity: 0.5;
                transform: scale(0.95);
                transition: transform 0.2s ease, opacity 0.2s ease;
            }

            .drag-over {
                background-color: rgba(0, 123, 255, 0.1) !important;
                border: 2px dashed #007bff !important;
                transition: all 0.2s ease;
            }

            .drag-ghost {
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
                border-radius: 4px;
            }

            /* Mobile specific improvements */
            @media (max-width: 768px) {
                .component-item, .section-item, [draggable="true"] {
                    padding: 12px;
                    margin: 4px 0;
                    touch-action: none;
                }
                
                .drag-elements ul li {
                    padding: 15px 10px;
                    border: 1px solid #ddd;
                    margin: 5px 0;
                    border-radius: 4px;
                    background: white;
                }

                /* Larger touch targets */
                .btn, .form-control, .nav-link {
                    min-height: 44px;
                    padding: 12px 16px;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    // Initialize everything
    addMobileStyles();
    initMobileDragDrop();

    // Export for manual initialization if needed
    window.MobileDragDrop = {
        init: initMobileDragDrop,
        setup: setupDraggableElements
    };

})();
