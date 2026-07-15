// ==UserScript==
// @name         YouTube Video Dimmer (with Toggle)
// @namespace    https://github.com/E-VanDeWoestyne
// @version      1.0
// @description  Cycle through video brightness/contrast levels on YouTube using Shift+D, with a brief on-screen indicator showing the current level.
// @author       E-VanDeWoestyne
// @match        https://www.youtube.com/*
// @grant        none
// @run-at       document-start
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // Define your brightness profiles: [brightness, contrast, label]
    const profiles = [
        { brightness: '1.0',  contrast: '1.0',  label: 'Off (100%)' },
        { brightness: '0.85', contrast: '0.97', label: 'Mild (85%)' },
        { brightness: '0.70', contrast: '0.94', label: 'Medium (70%)' },
        { brightness: '0.50', contrast: '0.90', label: 'Deep (50%)' }
    ];

    let currentProfileIndex = 0; // Starts at 100% by default

    // Inject our custom styles
    const style = document.createElement('style');
    style.id = 'yt-video-dimmer-styles';
    style.appendChild(document.createTextNode(`
        /* We use a CSS variable to dynamically change the filter */
        video.html5-main-video {
            filter: brightness(var(--yt-dimmer-b, 1.0)) contrast(var(--yt-dimmer-c, 1.0)) !important;
            transition: filter 0.15s ease-in-out;
        }
        /* On-screen display indicator */
        #yt-dimmer-osd {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(28, 28, 28, 0.9);
            color: #f1f1f1;
            padding: 8px 14px;
            border-radius: 4px;
            font-family: Roboto, Arial, sans-serif;
            font-size: 14px;
            font-weight: bold;
            z-index: 9999;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s ease-in-out;
            border: 1px solid rgba(255,255,255,0.1);
        }
    `));

    const injectStyles = () => {
        if (document.head) {
            document.head.appendChild(style);
        } else {
            const observer = new MutationObserver(() => {
                if (document.head) {
                    document.head.appendChild(style);
                    observer.disconnect();
                }
            });
            observer.observe(document.documentElement, { childList: true });
        }
    };
    injectStyles();

    // Show temporary on-screen indicator inside the YouTube player
    function showOSD(text) {
        let osd = document.getElementById('yt-dimmer-osd');
        const player = document.querySelector('#movie_player') || document.body;

        if (!osd) {
            osd = document.createElement('div');
            osd.id = 'yt-dimmer-osd';
            player.appendChild(osd);
        } else if (osd.parentElement !== player) {
            // Keep it inside the player if we navigated to a new video
            player.appendChild(osd);
        }

        osd.textContent = `Dimmer: ${text}`;
        osd.style.opacity = '1';

        // Clear existing timeout
        if (window.dimmerOsdTimeout) {
            clearTimeout(window.dimmerOsdTimeout);
        }

        // Fade out after 1.5 seconds
        window.dimmerOsdTimeout = setTimeout(() => {
            osd.style.opacity = '0';
        }, 1500);
    }

    // Apply the active profile to the document root variables
    function applyProfile(index) {
        const profile = profiles[index];
        document.documentElement.style.setProperty('--yt-dimmer-b', profile.brightness);
        document.documentElement.style.setProperty('--yt-dimmer-c', profile.contrast);
    }

    // Listen for the Shift+D hotkey
    window.addEventListener('keydown', (e) => {
        // Ignore keypresses if you are typing in a search bar or comment box
        const active = document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) {
            return;
        }

        // Shift + D (case-insensitive block for safety)
        if (e.shiftKey && (e.key === 'D' || e.key === 'd')) {
            e.preventDefault();
            e.stopPropagation();

            // Cycle index
            currentProfileIndex = (currentProfileIndex + 1) % profiles.length;
            applyProfile(currentProfileIndex);
            showOSD(profiles[currentProfileIndex].label);
        }
    }, true); // Use capture phase to catch keydown before YouTube blocks it
})();
