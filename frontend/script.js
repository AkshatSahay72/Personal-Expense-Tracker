// DOM Elements
const expenseForm = document.getElementById('expense-form');
const expenseIdInput = document.getElementById('expense-id');
const titleInput = document.getElementById('title');
const amountInput = document.getElementById('amount');
const categoryInput = document.getElementById('category');
const dateInput = document.getElementById('date');
const notesInput = document.getElementById('notes');

const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');

const expenseList = document.getElementById('expense-list');
const totalSpentEl = document.getElementById('total-spent');
const transactionCountEl = document.getElementById('transaction-count');
const topCategoryEl = document.getElementById('top-category');
const categoryProgressContainer = document.getElementById('category-progress-container');

// API Base URL (empty string since frontend is served from the same origin)
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
    expenseForm.addEventListener('submit', handleFormSubmit);
    cancelBtn.addEventListener('click', resetForm);
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
        allExpenses = await response.ok ? await response.json() : [];
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
                    <button type="button" class="btn-icon" onclick="startEditExpense(${expense.id})" title="Edit Expense">✏️</button>
                    <button type="button" class="btn-icon" onclick="deleteExpense(${expense.id})" title="Delete Expense">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Render category progress lists
function renderCategoryBreakdown(breakdown, totalSpending) {
    categoryProgressContainer.innerHTML = '';
    
    Object.entries(breakdown).forEach(([category, amount]) => {
        // Calculate percentage of total spent
        const percentage = totalSpending > 0 ? ((amount / totalSpending) * 100).toFixed(1) : 0;
        
        const progressItem = document.createElement('div');
        progressItem.className = 'progress-item';
        progressItem.innerHTML = `
            <div class="progress-label">
                <span>${category}</span>
                <span>${formatCurrency(amount)} (${percentage}%)</span>
            </div>
            <div class="progress-bar-bg">
                <div class="progress-bar-fill" style="width: ${percentage}%"></div>
            </div>
        `;
        categoryProgressContainer.appendChild(progressItem);
    });
}

// Handle Form Submission (Create or Update)
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const payload = {
        title: titleInput.value.trim(),
        amount: parseFloat(amountInput.value),
        category: categoryInput.value,
        date: dateInput.value,
        notes: notesInput.value.trim() || null
    };
    
    const expenseId = expenseIdInput.value;
    const isEdit = !!expenseId;
    
    const url = isEdit ? `${API_BASE}/expenses/${expenseId}` : `${API_BASE}/expenses`;
    const method = isEdit ? 'PUT' : 'POST';
    
    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || 'Validation error saving expense');
        }
        
        resetForm();
        await loadDashboard();
        
    } catch (error) {
        alert(`Error saving expense: ${error.message}`);
        console.error(error);
    }
}

// Start Edit Mode
window.startEditExpense = function(id) {
    const expense = allExpenses.find(exp => exp.id === id);
    if (!expense) return;
    
    expenseIdInput.value = expense.id;
    titleInput.value = expense.title;
    amountInput.value = expense.amount;
    categoryInput.value = expense.category;
    dateInput.value = expense.date;
    notesInput.value = expense.notes || '';
    
    formTitle.textContent = 'Edit Expense';
    submitBtn.textContent = 'Update Expense';
    cancelBtn.classList.remove('hidden');
    
    // Scroll form into view for mobile users
    expenseForm.scrollIntoView({ behavior: 'smooth' });
};

// Delete Expense
window.deleteExpense = async function(id) {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/expenses/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete expense');
        
        // Remove row immediately or refresh dashboard
        await loadDashboard();
        
    } catch (error) {
        alert(`Error deleting expense: ${error.message}`);
        console.error(error);
    }
};

// Reset Form to initial state
function resetForm() {
    expenseForm.reset();
    expenseIdInput.value = '';
    
    // Set default date back to today
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    
    formTitle.textContent = 'Add New Expense';
    submitBtn.textContent = 'Save Expense';
    cancelBtn.classList.add('hidden');
}

// Helper: Format Currency
function formatCurrency(val) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
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
