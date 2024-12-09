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
        try {
            // Try to get monitors using the Window Segments API (for Windows)
            if ('windowSegments' in window) {
                const segments = window.windowSegments;
                this.monitors = segments;
                console.log(`Detected ${segments.length} window segments`);
            } 
            // Fallback to screen enumeration
            else {
                this.monitors = await this.getConnectedDisplays();
                console.log(`Detected ${this.monitors.length} monitors`);
            }
        } catch (error) {
            console.error('Error detecting monitors:', error);
            this.monitors = [{ 
                left: 0, 
                top: 0, 
                width: window.screen.width, 
                height: window.screen.height 
            }];
        }
    }

    async getConnectedDisplays() {
        return new Promise((resolve) => {
            if (window.screen?.isExtended) {
                // Windows multi-monitor detection
                const displays = [];
                const primaryDisplay = {
                    left: window.screen.availLeft,
                    top: window.screen.availTop,
                    width: window.screen.availWidth,
                    height: window.screen.availHeight,
                    isPrimary: true
                };
                displays.push(primaryDisplay);

                // Check for additional displays using screen properties
                if (window.screen.isExtended) {
                    // Add secondary display (assuming it's to the right of primary)
                    displays.push({
                        left: primaryDisplay.left + primaryDisplay.width,
                        top: 0,
                        width: window.screen.width - primaryDisplay.width,
                        height: window.screen.height,
                        isPrimary: false
                    });
                }
                resolve(displays);
            } else {
                resolve([{
                    left: 0,
                    top: 0,
                    width: window.screen.width,
                    height: window.screen.height,
                    isPrimary: true
                }]);
            }
        });
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
        const { layout, screens, settings } = this.config;
        this.container.style.gridTemplateColumns = layout.columns.join(' ');
        this.container.style.gridTemplateRows = layout.rows.join(' ');

        // Handle multi-monitor spanning
        if (settings?.spanMonitors) {
            this.container.style.width = settings.totalWidth || '200vw';
            this.container.style.height = settings.totalHeight || '100vh';
            this.container.style.overflow = 'hidden';
        } else {
            this.container.style.width = '100%';
            this.container.style.height = '100%';
        }

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

            const monitor = this.monitors[this.currentMonitor];
            
            // Position the window on the correct monitor before going fullscreen
            if (window.moveTo) {
                window.moveTo(monitor.left, monitor.top);
            }

            // Set initial window size to match monitor
            if (window.resizeTo) {
                window.resizeTo(monitor.width, monitor.height);
            }

            // Apply monitor-specific styles
            this.container.style.position = 'fixed';
            this.container.style.left = '0';
            this.container.style.top = '0';
            this.container.style.width = '100%';
            this.container.style.height = '100%';

            // Enter fullscreen
            await this.container.requestFullscreen();
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