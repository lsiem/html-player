class HTMLPlayer {
    constructor() {
        this.container = document.getElementById('container');
        this.screens = new Map();
        this.config = null;
        this.monitors = [];
        this.currentMonitor = 0;
        this.initializeMonitors();
    }

    async initializeMonitors() {
        if (!window.screen?.getScreenDetails) {
            console.warn('Multi-monitor API not supported');
            this.monitors = [window.screen];
            return;
        }

        try {
            const screenDetails = await window.screen.getScreenDetails();
            this.monitors = screenDetails.screens;
            console.log(`Detected ${this.monitors.length} monitors`);
        } catch (error) {
            console.error('Error getting screen details:', error);
            this.monitors = [window.screen];
        }
    }

    async loadConfig(configPath) {
        try {
            const response = await fetch(configPath);
            this.config = await response.json();
            this.applyConfig();
        } catch (error) {
            console.error('Error loading configuration:', error);
        }
    }

    applyConfig() {
        if (!this.config) return;

        // Apply layout configuration
        const { layout, screens } = this.config;
        this.container.style.gridTemplateColumns = layout.columns.join(' ');
        this.container.style.gridTemplateRows = layout.rows.join(' ');

        // Clear existing screens
        this.container.innerHTML = '';
        this.screens.clear();

        // Create screens based on configuration
        screens.forEach(screen => {
            this.createScreen(screen);
        });
    }

    createScreen(screenConfig) {
        const { id, content, gridArea, zIndex } = screenConfig;
        const screenElement = document.createElement('div');
        screenElement.className = 'screen';
        screenElement.style.gridArea = gridArea;
        screenElement.style.zIndex = zIndex || 1;

        const iframe = document.createElement('iframe');
        iframe.src = content;
        screenElement.appendChild(iframe);
        
        this.container.appendChild(screenElement);
        this.screens.set(id, screenElement);

        return screenElement;
    }

    updateScreen(screenId, newContent) {
        const screen = this.screens.get(screenId);
        if (screen) {
            const iframe = screen.querySelector('iframe');
            iframe.src = newContent;
        }
    }

    async enterFullscreen(monitorIndex = null) {
        if (monitorIndex !== null && monitorIndex >= 0 && monitorIndex < this.monitors.length) {
            this.currentMonitor = monitorIndex;
        }

        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            }

            const options = {
                screen: this.monitors[this.currentMonitor]
            };

            await this.container.requestFullscreen(options);
            console.log(`Entered fullscreen on monitor ${this.currentMonitor}`);
        } catch (error) {
            console.error('Error entering fullscreen:', error);
        }
    }

    exitFullscreen() {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
    }

    setMonitor(index) {
        if (index >= 0 && index < this.monitors.length) {
            this.currentMonitor = index;
            console.log(`Selected monitor ${index}`);
            return true;
        }
        return false;
    }

    getMonitorCount() {
        return this.monitors.length;
    }
}

// Initialize the player
const player = new HTMLPlayer();

// Load the default configuration
player.loadConfig('config.json');

// Export the player instance for external access
window.htmlPlayer = player;