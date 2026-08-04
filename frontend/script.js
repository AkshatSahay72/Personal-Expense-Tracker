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
const closeBudgetModalBtn = document.getElementById('close-budget-modal-btn');
const cancelBudgetModalBtn = document.getElementById('cancel-budget-modal-btn');

// API Base URL
const API_BASE = '';

// App State
let allExpenses = [];

// Initialize Page
document.addEventListener('DOMContentLoaded', () => {
    // Set default date picker to today
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;

    // Load initial data
    loadDashboard();
    
    // Setup event listeners
    expenseForm.addEventListener('submit', handleAddFormSubmit);
    editExpenseForm.addEventListener('submit', handleEditFormSubmit);
    budgetForm.addEventListener('submit', handleBudgetFormSubmit);
    
    closeModalBtn.addEventListener('click', closeEditModal);
    editCancelBtn.addEventListener('click', closeEditModal);
    
    openBudgetModalBtn.addEventListener('click', openBudgetModal);
    closeBudgetModalBtn.addEventListener('click', closeBudgetModal);
    cancelBudgetModalBtn.addEventListener('click', closeBudgetModal);
    
    // Close modal when clicking on overlay background
    editModalOverlay.addEventListener('click', (e) => {
        if (e.target === editModalOverlay) closeEditModal();
    });

    budgetModalOverlay.addEventListener('click', (e) => {
        if (e.target === budgetModalOverlay) closeBudgetModal();
    });

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (editModalOverlay && !editModalOverlay.classList.contains('hidden')) closeEditModal();
            if (budgetModalOverlay && !budgetModalOverlay.classList.contains('hidden')) closeBudgetModal();
        }
    });
});

// Load all dashboard components
async function loadDashboard() {
    await fetchExpenses();
    await fetchSummary();
}

// Fetch all expenses from backend
async function fetchExpenses() {
    try {
        const response = await fetch(`${API_BASE}/expenses`);
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
        const response = await fetch(`${API_BASE}/summary`);
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
        const response = await fetch(`${API_BASE}/expenses`, {
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
        const response = await fetch(`${API_BASE}/expenses/${expenseId}`, {
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
        const response = await fetch(`${API_BASE}/budget`, {
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

// Delete Expense
window.deleteExpense = async function(id) {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/expenses/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete expense');
        
        await loadDashboard();
        
    } catch (error) {
        alert(`Error deleting expense: ${error.message}`);
        console.error(error);
    }
};

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
