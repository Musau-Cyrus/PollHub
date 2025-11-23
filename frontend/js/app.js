// Global state
let currentPollId = null;
let allPolls = [];

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    await loadPolls();
    updateStats();
});

/**
 * Load all polls from the API and display them
 */
async function loadPolls() {
    const pollsContainer = document.getElementById('polls-container');
    
    try {
        pollsContainer.innerHTML = '<div class="loading">Loading polls...</div>';
        
        allPolls = await getAllPolls();
        
        if (allPolls.length === 0) {
            pollsContainer.innerHTML = `
                <div class="loading">
                    <p>No polls available yet.</p>
                    <a href="create-poll.html" class="btn btn-primary" style="margin-top: 1rem;">Create the first poll</a>
                </div>
            `;
            return;
        }
        
        pollsContainer.innerHTML = allPolls.map(poll => createPollCard(poll)).join('');
        
    } catch (error) {
        console.error('Error loading polls:', error);
        pollsContainer.innerHTML = `
            <div class="loading" style="color: var(--red-500);">
                <p>Error loading polls. Please make sure the backend server is running.</p>
                <p style="font-size: 0.875rem; margin-top: 0.5rem;">Check console for details.</p>
            </div>
        `;
    }
}

/**
 * Create HTML for a poll card
 * @param {Object} poll - Poll object
 * @returns {string} HTML string
 */
function createPollCard(poll) {
    return `
        <div class="poll-card" onclick="viewPoll(${poll.id})">
            <h3>${sanitizeHTML(poll.question)}</h3>
            <div class="poll-meta">
                <span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle;">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    ${formatNumber(poll.totalVotes || 0)} votes
                </span>
                <span>${formatDate(poll.createdAt)}</span>
            </div>
            ${hasVoted(poll.id) ? '<span style="color: var(--primary-blue); font-size: 0.875rem; font-weight: 500;">✓ You voted</span>' : ''}
        </div>
    `;
}

/**
 * Update statistics display
 */
function updateStats() {
    const totalPollsElement = document.getElementById('total-polls');
    const totalVotesElement = document.getElementById('total-votes');
    const activeTodayElement = document.getElementById('active-today');
    
    if (totalPollsElement) {
        totalPollsElement.textContent = allPolls.length;
    }
    
    if (totalVotesElement) {
        const totalVotes = allPolls.reduce((sum, poll) => sum + (poll.totalVotes || 0), 0);
        totalVotesElement.textContent = formatNumber(totalVotes);
    }
    
    if (activeTodayElement) {
        // Count polls created today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const activeToday = allPolls.filter(poll => {
            const pollDate = new Date(poll.createdAt);
            pollDate.setHours(0, 0, 0, 0);
            return pollDate.getTime() === today.getTime();
        }).length;
        
        activeTodayElement.textContent = activeToday;
    }
}

/**
 * View poll details in modal
 * @param {number} pollId - Poll ID
 */
async function viewPoll(pollId) {
    currentPollId = pollId;
    const modal = document.getElementById('poll-modal');
    
    try {
        const poll = await getPollById(pollId);
        
        // Update modal content
        document.getElementById('modal-question').textContent = poll.question;
        document.getElementById('modal-votes').textContent = `${formatNumber(poll.totalVotes || 0)} votes`;
        document.getElementById('modal-date').textContent = formatDate(poll.createdAt);
        
        // Check if user has voted
        const voted = hasVoted(pollId);
        const userVote = getUserVote(pollId);
        
        // Create options HTML
        const optionsContainer = document.getElementById('modal-options');
        optionsContainer.innerHTML = poll.options.map(option => 
            createOptionHTML(option, poll.totalVotes, voted, userVote === option.id)
        ).join('');
        
        // Show modal
        modal.classList.add('active');
        
    } catch (error) {
        console.error('Error loading poll details:', error);
        alert('Error loading poll details. Please try again.');
    }
}

/**
 * Create HTML for a poll option
 * @param {Object} option - Option object
 * @param {number} totalVotes - Total votes for the poll
 * @param {boolean} voted - Whether user has voted
 * @param {boolean} isUserChoice - Whether this is the user's choice
 * @returns {string} HTML string
 */
function createOptionHTML(option, totalVotes, voted, isUserChoice) {
    const percentage = calculatePercentage(option.votesCount || 0, totalVotes);
    
    return `
        <button 
            class="option-button" 
            ${voted ? 'disabled' : `onclick="handleVote(${option.id})"`}
        >
            <div class="option-content">
                <span class="option-text">
                    ${sanitizeHTML(option.optionText)}
                    ${isUserChoice ? ' <span style="color: var(--primary-blue);">✓</span>' : ''}
                </span>
                ${voted ? `<span class="option-percentage">${percentage}%</span>` : ''}
            </div>
            ${voted ? `
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percentage}%"></div>
                </div>
            ` : ''}
        </button>
    `;
}

/**
 * Handle vote submission
 * @param {number} optionId - Option ID
 */
async function handleVote(optionId) {
    if (!currentPollId) return;
    
    try {
        await submitVote(currentPollId, optionId);
        
        // Mark as voted
        markAsVoted(currentPollId);
        saveUserVote(currentPollId, optionId);
        
        // Reload poll details to show results
        await viewPoll(currentPollId);
        
        // Reload polls list to update vote counts
        await loadPolls();
        updateStats();
        
    } catch (error) {
        console.error('Error submitting vote:', error);
        alert(error.message || 'Error submitting vote. Please try again.');
    }
}

/**
 * Close modal
 */
function closeModal() {
    const modal = document.getElementById('poll-modal');
    modal.classList.remove('active');
    currentPollId = null;
}

/**
 * Delete current poll
 */
async function deletePoll() {
    if (!currentPollId) return;
    
    if (!confirm('Are you sure you want to delete this poll? This action cannot be undone.')) {
        return;
    }
    
    try {
        await deletePoll(currentPollId);
        
        alert('Poll deleted successfully!');
        
        closeModal();
        await loadPolls();
        updateStats();
        
    } catch (error) {
        console.error('Error deleting poll:', error);
        alert('Error deleting poll. Please try again.');
    }
}

// Close modal when clicking outside
document.addEventListener('click', (event) => {
    const modal = document.getElementById('poll-modal');
    if (event.target === modal) {
        closeModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        closeModal();
    }
});