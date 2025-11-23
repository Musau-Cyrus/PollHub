/**
 * Format date to relative time (e.g., "2 hours ago", "3 days ago")
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Formatted relative time
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    // Less than a minute
    if (diffInSeconds < 60) {
        return 'Just now';
    }

    // Less than an hour
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    }

    // Less than a day
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    }

    // Less than a week
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
        return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    }

    // Less than a month
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
        return `${diffInWeeks} ${diffInWeeks === 1 ? 'week' : 'weeks'} ago`;
    }

    // Format as date
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });
}

/**
 * Calculate percentage
 * @param {number} votes - Number of votes for this option
 * @param {number} total - Total votes
 * @returns {number} Percentage rounded to 1 decimal place
 */
function calculatePercentage(votes, total) {
    if (total === 0) return 0;
    return Math.round((votes / total) * 1000) / 10;
}

/**
 * Show success message
 * @param {string} message - Success message text
 * @param {number} duration - Duration in milliseconds (default: 3000)
 */
function showSuccessMessage(message, duration = 3000) {
    const successElement = document.getElementById('success-message');
    if (successElement) {
        successElement.textContent = message;
        successElement.style.display = 'flex';
        
        setTimeout(() => {
            successElement.style.display = 'none';
        }, duration);
    }
}

/**
 * Show error message
 * @param {string} message - Error message text
 * @param {number} duration - Duration in milliseconds (default: 5000)
 */
function showErrorMessage(message, duration = 5000) {
    const errorElement = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    
    if (errorElement && errorText) {
        errorText.textContent = message;
        errorElement.style.display = 'flex';
        
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, duration);
    }
}

/**
 * Validate poll question
 * @param {string} question - Poll question text
 * @returns {boolean} True if valid
 */
function validateQuestion(question) {
    if (!question || question.trim().length === 0) {
        showErrorMessage('Please enter a poll question');
        return false;
    }
    
    if (question.length > 500) {
        showErrorMessage('Question must be 500 characters or less');
        return false;
    }
    
    return true;
}

/**
 * Validate poll options
 * @param {Array<string>} options - Array of option texts
 * @returns {boolean} True if valid
 */
function validateOptions(options) {
    // Filter out empty options
    const validOptions = options.filter(opt => opt.trim().length > 0);
    
    if (validOptions.length < 2) {
        showErrorMessage('Please provide at least 2 options');
        return false;
    }
    
    if (validOptions.length > 10) {
        showErrorMessage('Maximum 10 options allowed');
        return false;
    }
    
    // Check for duplicate options
    const uniqueOptions = new Set(validOptions.map(opt => opt.trim().toLowerCase()));
    if (uniqueOptions.size !== validOptions.length) {
        showErrorMessage('Duplicate options are not allowed');
        return false;
    }
    
    // Check option length
    for (const option of validOptions) {
        if (option.length > 200) {
            showErrorMessage('Each option must be 200 characters or less');
            return false;
        }
    }
    
    return true;
}

/**
 * Sanitize HTML to prevent XSS attacks
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
function sanitizeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Format number with commas (e.g., 1000 -> 1,000)
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Check if user has already voted on a poll (using localStorage)
 * @param {number} pollId - Poll ID
 * @returns {boolean} True if user has voted
 */
function hasVoted(pollId) {
    const votedPolls = JSON.parse(localStorage.getItem('votedPolls') || '[]');
    return votedPolls.includes(pollId);
}

/**
 * Mark poll as voted (using localStorage)
 * @param {number} pollId - Poll ID
 */
function markAsVoted(pollId) {
    const votedPolls = JSON.parse(localStorage.getItem('votedPolls') || '[]');
    if (!votedPolls.includes(pollId)) {
        votedPolls.push(pollId);
        localStorage.setItem('votedPolls', JSON.stringify(votedPolls));
    }
}

/**
 * Get user's vote for a specific poll
 * @param {number} pollId - Poll ID
 * @returns {number|null} Option ID if voted, null otherwise
 */
function getUserVote(pollId) {
    const votes = JSON.parse(localStorage.getItem('userVotes') || '{}');
    return votes[pollId] || null;
}

/**
 * Save user's vote for a specific poll
 * @param {number} pollId - Poll ID
 * @param {number} optionId - Option ID
 */
function saveUserVote(pollId, optionId) {
    const votes = JSON.parse(localStorage.getItem('userVotes') || '{}');
    votes[pollId] = optionId;
    localStorage.setItem('userVotes', JSON.stringify(votes));
}