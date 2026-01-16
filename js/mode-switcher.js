/**
 * Mode Switcher Module - Handles switching between short and long description modes
 */

const ModeSwitcher = {
    elements: {},

    /**
     * Initialize mode switcher
     */
    init() {
        this.cacheElements();
        this.bindEvents();
        this.initMode();
    },

    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.elements = {
            modeShort: document.getElementById('modeShort'),
            modeLong: document.getElementById('modeLong'),
            shortModeContent: document.getElementById('shortModeContent'),
            longModeContent: document.getElementById('longModeContent')
        };
    },

    /**
     * Bind click events
     */
    bindEvents() {
        if (this.elements.modeShort) {
            this.elements.modeShort.addEventListener('click', () => this.setMode('short'));
        }
        if (this.elements.modeLong) {
            this.elements.modeLong.addEventListener('click', () => this.setMode('long'));
        }
    },

    /**
     * Initialize mode from localStorage or URL parameter
     */
    initMode() {
        // Check URL parameter first
        const urlParams = new URLSearchParams(window.location.search);
        const urlMode = urlParams.get('mode');
        
        // If URL has valid mode, use it; otherwise use localStorage or default to 'short'
        let currentMode = 'short';
        if (urlMode === 'short' || urlMode === 'long') {
            currentMode = urlMode;
        } else {
            currentMode = localStorage.getItem('generator_mode') || 'short';
        }
        
        this.setMode(currentMode);
    },

    /**
     * Set mode (short/long)
     */
    setMode(mode) {
        if (!this.elements.modeShort || !this.elements.modeLong) return;

        // Update button states
        this.elements.modeShort.classList.toggle('active', mode === 'short');
        this.elements.modeLong.classList.toggle('active', mode === 'long');
        
        // Show/hide content sections
        if (mode === 'short') {
            if (this.elements.shortModeContent) {
                this.elements.shortModeContent.classList.remove('hidden');
            }
            if (this.elements.longModeContent) {
                this.elements.longModeContent.classList.add('hidden');
            }
        } else {
            if (this.elements.shortModeContent) {
                this.elements.shortModeContent.classList.add('hidden');
            }
            if (this.elements.longModeContent) {
                this.elements.longModeContent.classList.remove('hidden');
            }
        }
        
        // Save to localStorage
        localStorage.setItem('generator_mode', mode);
        
        // Update URL without reload
        const url = new URL(window.location);
        url.searchParams.set('mode', mode);
        window.history.replaceState({}, '', url);
    },

    /**
     * Get current mode
     */
    getMode() {
        return localStorage.getItem('generator_mode') || 'short';
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => ModeSwitcher.init());
