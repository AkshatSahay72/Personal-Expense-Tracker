// DOM Elements - Main Form
const expenseForm = document.getElementById('expense-form');
const titleInput = document.getElementById('title');
const amountInput = document.getElementById('amount');
const categoryInput = document.getElementById('category');
const dateInput = document.getElementById('date');
const notesInput = document.getElementById('notes');

// DOM Elements - Edit Modal
const editModalOverlay = document.getElementById('edit-modal-overlay');
const editExpenseForm = document.getElementById('edit-expense-form');
const editExpenseIdInput = document.getElementById('edit-expense-id');
const editTitleInput = document.getElementById('edit-title');
const editAmountInput = document.getElementById('edit-amount');
const editCategoryInput = document.getElementById('edit-category');
const editDateInput = document.getElementById('edit-date');
const editNotesInput = document.getElementById('edit-notes');
const closeModalBtn = document.getElementById('close-modal-btn');
const editCancelBtn = document.getElementById('edit-cancel-btn');

// Dashboard Display Elements
const expenseList = document.getElementById('expense-list');
const totalSpentEl = document.getElementById('total-spent');
const transactionCountEl = document.getElementById('transaction-count');
const topCategoryEl = document.getElementById('top-category');
const categoryProgressContainer = document.getElementById('category-progress-container');

// DOM Elements - Budget Modal & Display
const monthSpentEl = document.getElementById('month-spent');
const budgetLimitEl = document.getElementById('budget-limit');
const budgetProgressFill = document.getElementById('budget-progress-fill');
const budgetStatusBadge = document.getElementById('budget-status-badge');
const openBudgetModalBtn = document.getElementById('open-budget-modal-btn');
const budgetModalOverlay = document.getElementById('budget-modal-overlay');
const budgetForm = document.getElementById('budget-form');
const monthlyBudgetInput = document.getElementById('monthly-budget-input');
const searchExpenseInput = document.getElementById("search-expense");
const closeBudgetModalBtn = document.getElementById('close-budget-modal-btn');
const cancelBudgetModalBtn = document.getElementById('cancel-budget-modal-btn');

// DOM Elements - Delete Modal
const deleteModalOverlay = document.getElementById('delete-modal-overlay');
const deleteExpenseTitleEl = document.getElementById('delete-expense-title');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
const closeDeleteModalBtn = document.getElementById('close-delete-modal-btn');
const cancelDeleteModalBtn = document.getElementById('cancel-delete-modal-btn');

// API Base URL
const API_BASE = '';

// App State
let allExpenses = [];
let pendingDeleteId = null;
let expenseChartInstance = null;
let sessionToken = localStorage.getItem('sessionToken');
let currentUser = null;

// DOM Elements - Auth
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const authAlert = document.getElementById('auth-alert');
const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const usernameDisplay = document.getElementById('username-display');
const logoutBtn = document.getElementById('logout-btn');

// Chart and Toggle Elements
const toggleViewBtn = document.getElementById('toggle-view-btn');
const chartViewContainer = document.getElementById('chart-view-container');
const tableViewContainer = document.getElementById('table-view-container');
const expenseChartCanvas = document.getElementById('expenseChart');

document.addEventListener('DOMContentLoaded', () => {
    // Set default date picker to today
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;

    searchExpenseInput.addEventListener("input", filterExpenses);

    // Check if token exists and verify it
    checkAuth();
    
    // Setup event listeners
    expenseForm.addEventListener('submit', handleAddFormSubmit);
    editExpenseForm.addEventListener('submit', handleEditFormSubmit);
    budgetForm.addEventListener('submit', handleBudgetFormSubmit);
    
    loginForm.addEventListener('submit', handleLoginFormSubmit);
    registerForm.addEventListener('submit', handleRegisterFormSubmit);
    logoutBtn.addEventListener('click', handleLogout);
    
    closeModalBtn.addEventListener('click', closeEditModal);
    editCancelBtn.addEventListener('click', closeEditModal);
    
    openBudgetModalBtn.addEventListener('click', openBudgetModal);
    closeBudgetModalBtn.addEventListener('click', closeBudgetModal);
    cancelBudgetModalBtn.addEventListener('click', closeBudgetModal);

    closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
    cancelDeleteModalBtn.addEventListener('click', closeDeleteModal);
    confirmDeleteBtn.addEventListener('click', handleConfirmDelete);
    
    // Close modal when clicking on overlay background
    editModalOverlay.addEventListener('click', (e) => {
        if (e.target === editModalOverlay) closeEditModal();
    });

    budgetModalOverlay.addEventListener('click', (e) => {
        if (e.target === budgetModalOverlay) closeBudgetModal();
    });

    deleteModalOverlay.addEventListener('click', (e) => {
        if (e.target === deleteModalOverlay) closeDeleteModal();
    });

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (editModalOverlay && !editModalOverlay.classList.contains('hidden')) closeEditModal();
            if (budgetModalOverlay && !budgetModalOverlay.classList.contains('hidden')) closeBudgetModal();
            if (deleteModalOverlay && !deleteModalOverlay.classList.contains('hidden')) closeDeleteModal();
        }
    });

    // Toggle view listener
    if (toggleViewBtn) {
        toggleViewBtn.addEventListener('click', () => {
            const isTableHidden = tableViewContainer.classList.contains('hidden');
            if (isTableHidden) {
                tableViewContainer.classList.remove('hidden');
                chartViewContainer.classList.add('hidden');
                toggleViewBtn.textContent = 'View Chart';
            } else {
                tableViewContainer.classList.add('hidden');
                chartViewContainer.classList.remove('hidden');
                toggleViewBtn.textContent = 'View Table';
            }
        });
    }
});

// Load all dashboard components
async function loadDashboard() {
    await fetchExpenses();
    await fetchSummary();
}

// Fetch all expenses from backend
async function fetchExpenses() {
    try {
        const response = await apiFetch(`${API_BASE}/expenses`);
        if (!response.ok) throw new Error('Failed to fetch expenses');
        allExpenses = await response.json();
        renderExpensesTable(allExpenses);
    } catch (error) {
        console.error('Error fetching expenses:', error);
        expenseList.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">Error loading expenses.</td></tr>`;
    }
}



// Fetch and render summary details
async function fetchSummary() {
    try {
        const response = await apiFetch(`${API_BASE}/summary`);
        if (!response.ok) throw new Error('Failed to fetch summary data');
        const summary = await response.json();
        
        // Update stats
        totalSpentEl.textContent = formatCurrency(summary.total_spending);
        transactionCountEl.textContent = summary.transaction_count;
        
        // Find top category
        let topCategory = 'N/A';
        let maxAmount = 0;
        
        Object.entries(summary.category_breakdown).forEach(([cat, amt]) => {
            if (amt > maxAmount) {
                maxAmount = amt;
                topCategory = cat;
            }
        });
        
        topCategoryEl.textContent = topCategory !== 'N/A' ? `${topCategory} (${formatCurrency(maxAmount)})` : 'N/A';
        
        // Update Monthly Budget Metrics
        if (monthSpentEl && budgetLimitEl && budgetProgressFill && budgetStatusBadge) {
            monthSpentEl.textContent = formatCurrency(summary.current_month_spending || 0);
            budgetLimitEl.textContent = formatCurrency(summary.monthly_budget || 30000);
            
            const pct = summary.budget_percentage_used || 0;
            budgetStatusBadge.textContent = `${pct}%`;
            
            const fillWidth = Math.min(pct, 100);
            budgetProgressFill.style.width = `${fillWidth}%`;
            
            budgetStatusBadge.className = 'budget-status-badge ';
            budgetProgressFill.className = 'budget-progress-fill ';
            
            if (pct < 75) {
                budgetStatusBadge.classList.add('badge-healthy');
                budgetProgressFill.classList.add('fill-healthy');
            } else if (pct <= 90) {
                budgetStatusBadge.classList.add('badge-caution');
                budgetProgressFill.classList.add('fill-caution');
            } else {
                budgetStatusBadge.classList.add('badge-alert');
                budgetProgressFill.classList.add('fill-alert');
            }
        }

        // Render category breakdown progress bars
        renderCategoryBreakdown(summary.category_breakdown, summary.total_spending);
        
        // Update Chart
        if (typeof updateExpenseChart === 'function') {
            updateExpenseChart(summary.category_breakdown);
        }
        
    } catch (error) {
        console.error('Error fetching summary:', error);
    }
}

// Render the transactions table
function renderExpensesTable(expenses) {
    if (expenses.length === 0) {
        expenseList.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-secondary);">No transactions recorded. Add your first expense on the left!</td></tr>`;
        return;
    }
    
    expenseList.innerHTML = expenses.map(expense => `
        <tr id="expense-row-${expense.id}">
            <td>${formatDate(expense.date)}</td>
            <td style="font-weight: 500;">${escapeHTML(expense.title)}</td>
            <td><span class="category-badge cat-${expense.category.toLowerCase()}">${expense.category}</span></td>
            <td style="font-weight: 600;">${formatCurrency(expense.amount)}</td>
            <td style="color: var(--text-secondary); max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${expense.notes ? escapeHTML(expense.notes) : '-'}
            </td>
            <td class="actions-col">
                <div class="action-buttons">
                    <button type="button" class="btn-action-edit" onclick="startEditExpense(${expense.id})" title="Edit Expense">Edit</button>
                    <button type="button" class="btn-action-delete" onclick="deleteExpense(${expense.id})" title="Delete Expense">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Render category progress lists
function renderCategoryBreakdown(breakdown, totalSpending) {
    categoryProgressContainer.innerHTML = '';
    
    Object.entries(breakdown).forEach(([category, amount]) => {
        const percentage = totalSpending > 0 ? ((amount / totalSpending) * 100).toFixed(1) : 0;
        
        const progressItem = document.createElement('div');
        progressItem.className = 'progress-item';
        progressItem.innerHTML = `
            <div class="progress-label">
                <span>${category}</span>
                <span>${formatCurrency(amount)} (${percentage}%)</span>
            </div>
            <div class="progress-bar-bg">
                <div class="progress-bar-fill fill-${category.toLowerCase()}" style="width: ${percentage}%"></div>
            </div>
        `;
        categoryProgressContainer.appendChild(progressItem);
    });
}

// Handle Add Form Submission
async function handleAddFormSubmit(e) {
    e.preventDefault();
    
    const payload = {
        title: titleInput.value.trim(),
        amount: parseFloat(amountInput.value),
        category: categoryInput.value,
        date: dateInput.value,
        notes: notesInput.value.trim() || null
    };
    
    try {
        const response = await apiFetch(`${API_BASE}/expenses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || 'Validation error saving expense');
        }
        
        resetAddForm();
        await loadDashboard();
        
    } catch (error) {
        alert(`Error saving expense: ${error.message}`);
        console.error(error);
    }
}

// Open Edit Modal Popup & Prepopulate Data
window.startEditExpense = function(id) {
    const expense = allExpenses.find(exp => String(exp.id) === String(id));
    if (!expense) {
        console.warn(`Expense with ID ${id} not found.`);
        return;
    }
    
    editExpenseIdInput.value = expense.id;
    editTitleInput.value = expense.title;
    editAmountInput.value = expense.amount;
    editCategoryInput.value = expense.category;
    
    // Format date string to YYYY-MM-DD
    const cleanDate = expense.date && expense.date.includes('T') ? expense.date.split('T')[0] : expense.date;
    editDateInput.value = cleanDate;
    
    editNotesInput.value = expense.notes || '';
    
    // Show Modal
    editModalOverlay.classList.remove('hidden');
};

// Close Edit Modal
function closeEditModal() {
    editModalOverlay.classList.add('hidden');
    editExpenseForm.reset();
}

// Handle Edit Modal Form Submission (PUT)
async function handleEditFormSubmit(e) {
    e.preventDefault();
    
    const expenseId = editExpenseIdInput.value;
    if (!expenseId) return;
    
    const payload = {
        title: editTitleInput.value.trim(),
        amount: parseFloat(editAmountInput.value),
        category: editCategoryInput.value,
        date: editDateInput.value,
        notes: editNotesInput.value.trim() || null
    };
    
    try {
        const response = await apiFetch(`${API_BASE}/expenses/${expenseId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || 'Validation error updating expense');
        }
        
        closeEditModal();
        await loadDashboard();
        
    } catch (error) {
        alert(`Error updating expense: ${error.message}`);
        console.error(error);
    }
}

// Open Budget Modal
function openBudgetModal() {
    const currentLimitStr = budgetLimitEl.textContent.replace(/[^0-9.]/g, '');
    monthlyBudgetInput.value = currentLimitStr || 30000;
    budgetModalOverlay.classList.remove('hidden');
}

function filterExpenses(){

    const keyword = searchExpenseInput.value
        .trim()
        .toLowerCase();

    const filtered = allExpenses.filter(expense =>
        expense.title.toLowerCase().includes(keyword)
    );

    renderExpensesTable(filtered);

}

// Close Budget Modal
function closeBudgetModal() {
    budgetModalOverlay.classList.add('hidden');
    budgetForm.reset();
}

// Handle Budget Form Submit (PUT /budget)
async function handleBudgetFormSubmit(e) {
    e.preventDefault();
    const newLimit = parseFloat(monthlyBudgetInput.value);
    if (isNaN(newLimit) || newLimit <= 0) return;
    
    try {
        const response = await apiFetch(`${API_BASE}/budget`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ monthly_limit: newLimit })
        });
        
        if (!response.ok) throw new Error('Failed to update budget limit');
        
        closeBudgetModal();
        await loadDashboard();
    } catch (error) {
        alert(`Error updating budget: ${error.message}`);
        console.error(error);
    }
}

// Trigger Delete Confirmation Modal
window.deleteExpense = function(id) {
    const expense = allExpenses.find(exp => String(exp.id) === String(id));
    pendingDeleteId = id;
    deleteExpenseTitleEl.textContent = expense ? `"${expense.title}"` : 'this expense';
    deleteModalOverlay.classList.remove('hidden');
};

// Close Delete Modal
function closeDeleteModal() {
    deleteModalOverlay.classList.add('hidden');
    pendingDeleteId = null;
}

// Handle Confirm Delete
async function handleConfirmDelete() {
    if (!pendingDeleteId) return;
    
    try {
        const response = await apiFetch(`${API_BASE}/expenses/${pendingDeleteId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete expense');
        
        closeDeleteModal();
        await loadDashboard();
        
    } catch (error) {
        alert(`Error deleting expense: ${error.message}`);
        console.error(error);
    }
}

// Reset Add Form
function resetAddForm() {
    expenseForm.reset();
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
}

// Helper: Format Currency
function formatCurrency(val) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(val);
}

// Helper: Format Date
function formatDate(dateStr) {
    const [year, month, day] = dateStr.split('-');
    const dateObj = new Date(year, month - 1, day);
    return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

// Helper: Escape HTML
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// Update or create the Chart.js instance
function updateExpenseChart(categoryBreakdown) {
    if (!expenseChartCanvas || !window.Chart) return;
    
    const ctx = expenseChartCanvas.getContext('2d');
    const labels = Object.keys(categoryBreakdown);
    const data = Object.values(categoryBreakdown);
    
    // Modern colors for the chart
    const bgColors = [
        'rgba(59, 130, 246, 0.7)', // Blue
        'rgba(16, 185, 129, 0.7)', // Green
        'rgba(245, 158, 11, 0.7)', // Yellow
        'rgba(239, 68, 68, 0.7)',  // Red
        'rgba(139, 92, 246, 0.7)', // Purple
        'rgba(107, 114, 128, 0.7)' // Gray
    ];
    
    const borderColors = bgColors.map(color => color.replace('0.7', '1'));

    if (expenseChartInstance) {
        expenseChartInstance.data.labels = labels;
        expenseChartInstance.data.datasets[0].data = data;
        expenseChartInstance.update();
    } else {
        expenseChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: bgColors,
                    borderColor: borderColors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    }
}

// Authenticated API fetch wrapper
async function apiFetch(url, options = {}) {
    const headers = options.headers || {};
    if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
    }
    
    const response = await fetch(url, {
        ...options,
        headers: headers
    });
    
    if (response.status === 401) {
        handleUnauthenticated();
    }
    
    return response;
}

// Check auth status on load
async function checkAuth() {
    if (!sessionToken) {
        handleUnauthenticated();
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/me`, {
            headers: { 'Authorization': `Bearer ${sessionToken}` }
        });
        
        if (response.ok) {
            currentUser = await response.json();
            usernameDisplay.textContent = currentUser.username;
            
            authContainer.classList.add('hidden');
            appContainer.classList.remove('hidden');
            
            await loadDashboard();
        } else {
            handleUnauthenticated();
        }
    } catch (error) {
        console.error('Error verifying authentication:', error);
        handleUnauthenticated();
    }
}

// Switch between login & register tabs
window.switchAuthTab = function(tab) {
    showAuthAlert('');
    
    if (tab === 'login') {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    } else {
        tabLogin.classList.remove('active');
        tabRegister.classList.add('active');
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
    }
};

// Handle Login Submit
async function handleLoginFormSubmit(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    
    showAuthAlert('');
    
    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            sessionToken = data.token;
            localStorage.setItem('sessionToken', sessionToken);
            currentUser = data.user;
            usernameDisplay.textContent = currentUser.username;
            
            showAuthAlert('Success! Logging you in...', 'success');
            
            setTimeout(async () => {
                authContainer.classList.add('hidden');
                appContainer.classList.remove('hidden');
                loginForm.reset();
                await loadDashboard();
            }, 800);
        } else {
            showAuthAlert(data.detail || 'Login failed. Please check credentials.', 'error');
        }
    } catch (error) {
        showAuthAlert('Network error connecting to login service.', 'error');
        console.error(error);
    }
}

// Handle Register Submit
async function handleRegisterFormSubmit(e) {
    e.preventDefault();
    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    
    showAuthAlert('');
    
    if (password !== confirmPassword) {
        showAuthAlert('Passwords do not match.', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            sessionToken = data.token;
            localStorage.setItem('sessionToken', sessionToken);
            currentUser = data.user;
            usernameDisplay.textContent = currentUser.username;
            
            showAuthAlert('Account created successfully! Redirecting...', 'success');
            
            setTimeout(async () => {
                authContainer.classList.add('hidden');
                appContainer.classList.remove('hidden');
                registerForm.reset();
                await loadDashboard();
            }, 800);
        } else {
            showAuthAlert(data.detail || 'Registration failed. Username may be taken.', 'error');
        }
    } catch (error) {
        showAuthAlert('Network error connecting to registration service.', 'error');
        console.error(error);
    }
}

// Show alert message in auth card
function showAuthAlert(message, type = '') {
    if (!message) {
        authAlert.classList.add('hidden');
        authAlert.className = 'auth-alert hidden';
        authAlert.textContent = '';
        return;
    }
    
    authAlert.textContent = message;
    authAlert.className = `auth-alert ${type}`;
    authAlert.classList.remove('hidden');
}

// Logout Handler
async function handleLogout() {
    if (sessionToken) {
        try {
            await fetch(`${API_BASE}/logout`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${sessionToken}` }
            });
        } catch (error) {
            console.error('Error logging out from server:', error);
        }
    }
    handleUnauthenticated();
}

// Handle unauthenticated state
function handleUnauthenticated() {
    sessionToken = null;
    localStorage.removeItem('sessionToken');
    currentUser = null;
    
    appContainer.classList.add('hidden');
    authContainer.classList.remove('hidden');
}
