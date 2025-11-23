// Initialize form when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('create-poll-form');
    form.addEventListener('submit', handleFormSubmit);
});

/**
 * Add a new option input field
 */
function addOption() {
    const container = document.getElementById('options-container');
    const currentOptions = container.querySelectorAll('.option-input-group').length;
    
    // Limit to 10 options
    if (currentOptions >= 10) {
        showErrorMessage('Maximum 10 options allowed');
        return;
    }
    
    const optionDiv = document.createElement('div');
    optionDiv.className = 'option-input-group';
    optionDiv.innerHTML = `
        <input 
            type="text" 
            class="form-input option-input" 
            placeholder="Option ${currentOptions + 1}"
            maxlength="200"
        >
    `;
    
    container.appendChild(optionDiv);
}

/**
 * Handle form submission
 * @param {Event} event - Form submit event
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    
    // Get form values
    const question = document.getElementById('poll-question').value.trim();
    const createdBy = document.getElementById('created-by').value.trim() || 'Anonymous';
    
    // Get all option inputs
    const optionInputs = document.querySelectorAll('.option-input');
    const options = Array.from(optionInputs)
        .map(input => input.value.trim())
        .filter(value => value.length > 0);
    
    // Validate inputs
    if (!validateQuestion(question)) {
        return;
    }
    
    if (!validateOptions(options)) {
        return;
    }
    
    // Prepare poll data
    const pollData = {
        question: question,
        createdBy: createdBy,
        options: options
    };
    
    // Submit to API
    try {
        // Disable form
        const submitButton = event.target.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Creating Poll...';
        
        const result = await createPoll(pollData);
        
        // Show success message
        showSuccessMessage('Poll created successfully! Redirecting...');
        
        // Redirect to home page after 2 seconds
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        
    } catch (error) {
        console.error('Error creating poll:', error);
        showErrorMessage(error.message || 'Error creating poll. Please try again.');
        
        // Re-enable form
        const submitButton = event.target.querySelector('button[type="submit"]');
        submitButton.disabled = false;
        submitButton.textContent = 'Create Poll';
    }
}

/**
 * Remove an option input field (optional enhancement)
 * @param {HTMLElement} element - The remove button element
 */
function removeOption(element) {
    const container = document.getElementById('options-container');
    const currentOptions = container.querySelectorAll('.option-input-group').length;
    
    // Keep at least 2 options
    if (currentOptions <= 2) {
        showErrorMessage('At least 2 options are required');
        return;
    }
    
    element.closest('.option-input-group').remove();
    
    // Update placeholder numbers
    updateOptionPlaceholders();
}

/**
 * Update option input placeholders after adding/removing
 */
function updateOptionPlaceholders() {
    const optionInputs = document.querySelectorAll('.option-input');
    optionInputs.forEach((input, index) => {
        input.placeholder = `Option ${index + 1}`;
    });
}

/**
 * Real-time character count for question (optional enhancement)
 */
const questionInput = document.getElementById('poll-question');
if (questionInput) {
    questionInput.addEventListener('input', (e) => {
        const length = e.target.value.length;
        const maxLength = 500;
        
        // You can add a character counter element if desired
        console.log(`Characters: ${length}/${maxLength}`);
    });
}