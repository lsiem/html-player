class HTMLPlayer {
    constructor() {
        this.container = document.getElementById('container');
        this.screens = new Map();
        this.config = null;
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
}

// Initialize the player
const player = new HTMLPlayer();

// Load the default configuration
player.loadConfig('config.json');

// Export the player instance for external access
window.htmlPlayer = player;