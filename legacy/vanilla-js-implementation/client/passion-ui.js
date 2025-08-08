// Passion UI Components and Management
// Handles the user interface for passion selection and display

class PassionUI {
    constructor() {
        this.isModalOpen = false;
        this.init();
    }
    
    init() {
        this.createPassionButton();
        this.createPassionModal();
        this.updatePassionDisplay();
        this.setupEventListeners();
    }
    
    // Create the main passion button in the header
    createPassionButton() {
        const header = document.querySelector('.header .container');
        if (!header) return;
        
        const passionButton = document.createElement('button');
        passionButton.className = 'passion-toggle-btn';
        passionButton.innerHTML = `
            <div class="passion-btn-icon">
                <i class="fas fa-heart"></i>
            </div>
            <div class="passion-btn-content">
                <span class="passion-btn-label">Travel Passions</span>
                <span class="passion-btn-subtitle">Personalize your search</span>
            </div>
            <span class="passion-count">0</span>
            <div class="passion-btn-arrow">
                <i class="fas fa-chevron-right"></i>
            </div>
        `;
        passionButton.onclick = () => this.toggleModal();
        passionButton.title = "Select your travel interests to get personalized hotel recommendations";
        
        // Insert before the nav element
        const nav = header.querySelector('.nav');
        if (nav) {
            header.insertBefore(passionButton, nav);
        } else {
            header.appendChild(passionButton);
        }
    }
    
    // Create the passion selection modal
    createPassionModal() {
        const modal = document.createElement('div');
        modal.className = 'passion-modal';
        modal.id = 'passionModal';
        modal.innerHTML = `
            <div class="passion-modal-overlay" onclick="passionUI.closeModal()"></div>
            <div class="passion-modal-content">
                <div class="passion-modal-header">
                    <div class="passion-header-content">
                        <h2><i class="fas fa-heart"></i> Choose Your Travel Passions</h2>
                        <p class="passion-explanation">Tell us what excites you most when traveling! We'll show you hotels that match your interests - from gourmet dining and spa retreats to adventure sports and cultural experiences.</p>
                        <div class="passion-benefits">
                            <div class="benefit-item">
                                <i class="fas fa-bullseye"></i>
                                <span>Get personalized recommendations</span>
                            </div>
                            <div class="benefit-item">
                                <i class="fas fa-filter"></i>
                                <span>Filter hotels by your interests</span>
                            </div>
                            <div class="benefit-item">
                                <i class="fas fa-star"></i>
                                <span>Discover perfect matches</span>
                            </div>
                        </div>
                    </div>
                    <button class="passion-modal-close" onclick="passionUI.closeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="passion-grid" id="passionGrid">
                    ${this.renderPassionGrid()}
                </div>
                
                <div class="passion-modal-footer">
                    <div class="selected-passions-summary" id="selectedSummary">
                        <span class="summary-text">No passions selected</span>
                    </div>
                    <div class="passion-modal-actions">
                        <button class="clear-btn" onclick="passionUI.clearAllPassions()">
                            Clear All
                        </button>
                        <button class="apply-btn" onclick="passionUI.applyPassions()">
                            Apply & Search
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    // Render the passion selection grid
    renderPassionGrid() {
        const passions = window.passionMatcher.getAllPassions();
        return passions.map(passion => `
            <div class="passion-card ${window.passionProfile.isSelected(passion.id) ? 'selected' : ''}" 
                 data-passion-id="${passion.id}"
                 onclick="passionUI.togglePassion('${passion.id}')">
                <div class="passion-icon" style="background-color: ${passion.color}20; color: ${passion.color}">
                    ${passion.icon}
                </div>
                <div class="passion-info">
                    <h3 class="passion-name">${passion.name}</h3>
                    <p class="passion-description">${passion.description}</p>
                </div>
                <div class="passion-check">
                    <i class="fas fa-check"></i>
                </div>
            </div>
        `).join('');
    }
    
    // Toggle passion selection
    togglePassion(passionId) {
        window.passionProfile.togglePassion(passionId);
        this.updatePassionGrid();
        this.updateSelectedSummary();
        this.updatePassionDisplay();
    }
    
    // Update the passion grid display
    updatePassionGrid() {
        const grid = document.getElementById('passionGrid');
        if (grid) {
            grid.innerHTML = this.renderPassionGrid();
        }
    }
    
    // Update the selected passions summary
    updateSelectedSummary() {
        const summary = document.getElementById('selectedSummary');
        if (!summary) return;
        
        const selected = window.passionProfile.getSelectedPassions();
        if (selected.length === 0) {
            summary.innerHTML = '<span class="summary-text">No passions selected</span>';
        } else {
            const passionNames = selected.map(p => p.name).join(', ');
            summary.innerHTML = `
                <span class="summary-text">
                    <strong>${selected.length}</strong> passion${selected.length > 1 ? 's' : ''} selected: 
                    ${passionNames}
                </span>
            `;
        }
    }
    
    // Update the main passion button display
    updatePassionDisplay() {
        const button = document.querySelector('.passion-toggle-btn');
        if (!button) return;
        
        const count = window.passionProfile.getSelected().length;
        const countElement = button.querySelector('.passion-count');
        
        if (countElement) {
            countElement.textContent = count;
            countElement.style.display = count > 0 ? 'inline-flex' : 'none';
        }
        
        // Update button state
        if (count > 0) {
            button.classList.add('has-selections');
        } else {
            button.classList.remove('has-selections');
        }
    }
    
    // Toggle modal visibility
    toggleModal() {
        if (this.isModalOpen) {
            this.closeModal();
        } else {
            this.openModal();
        }
    }
    
    // Open the passion modal
    openModal() {
        const modal = document.getElementById('passionModal');
        if (modal) {
            modal.classList.add('active');
            this.isModalOpen = true;
            this.updatePassionGrid();
            this.updateSelectedSummary();
            document.body.style.overflow = 'hidden';
        }
    }
    
    // Close the passion modal
    closeModal() {
        const modal = document.getElementById('passionModal');
        if (modal) {
            modal.classList.remove('active');
            this.isModalOpen = false;
            document.body.style.overflow = '';
        }
    }
    
    // Clear all passion selections
    clearAllPassions() {
        window.passionProfile.clearAll();
        this.updatePassionGrid();
        this.updateSelectedSummary();
        this.updatePassionDisplay();
        
        // Refresh search results if they exist
        if (window.filteredHotels && window.filteredHotels.length > 0) {
            window.displayHotels();
        }
    }
    
    // Apply passions and trigger search refresh
    applyPassions() {
        this.closeModal();
        
        // Refresh search results if they exist
        if (window.filteredHotels && window.filteredHotels.length > 0) {
            window.displayHotels();
        }
        
        // Show a brief confirmation
        this.showApplyConfirmation();
    }
    
    // Show confirmation that passions were applied
    showApplyConfirmation() {
        const selected = window.passionProfile.getSelectedPassions();
        if (selected.length === 0) return;
        
        const passionNames = selected.map(p => p.name).join(', ');
        
        // Create temporary notification
        const notification = document.createElement('div');
        notification.className = 'passion-notification';
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="fas fa-heart"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">Passions Applied!</div>
                <div class="notification-message">Hotels now personalized for: ${passionNames}</div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Show and hide notification
        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }
    
    // Setup event listeners
    setupEventListeners() {
        // Close modal on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isModalOpen) {
                this.closeModal();
            }
        });
    }
    
    // Generate passion match display for hotel cards
    generatePassionMatchDisplay(passionScore) {
        if (!passionScore || passionScore.totalScore === 0) {
            return '';
        }
        
        const strength = window.passionMatcher.getPassionStrength(passionScore.totalScore);
        const topMatches = passionScore.matches.slice(0, 2);
        
        return `
            <div class="passion-match-display">
                <div class="passion-score">
                    <i class="fas fa-heart"></i>
                    <span class="score-text">${strength}</span>
                    <span class="score-value">${passionScore.totalScore}%</span>
                </div>
                <div class="passion-matches">
                    ${topMatches.map(match => `
                        <div class="passion-match-item" style="border-left-color: ${match.passion.color}">
                            <span class="match-icon">${match.passion.icon}</span>
                            <span class="match-name">${match.passion.name}</span>
                            <span class="match-reason">${match.reasons[0] || ''}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
}

// Initialize passion UI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.passionUI = new PassionUI();
});

// Make sure it's available globally
window.PassionUI = PassionUI;
