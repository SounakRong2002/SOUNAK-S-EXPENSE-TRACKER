const STORAGE_KEY = "expenseTrackerData";
const INVESTMENTS_STORAGE_KEY = "expenseTrackerInvestments";

/* Auth guard - wait for Firebase then redirect if not authenticated */
(async function authGuard() {
  if (typeof whenAuthReady === "function") await whenAuthReady();
  if (typeof isLoggedIn === "function" && !isLoggedIn()) {
    window.location.replace("login.html");
    return;
  }
  initApp();
})();

function initApp() {
const incomeCategories = ["Salary", "Freelance", "Investments", "Gifts", "Other"];
const expenseCategories = [
  "Housing",
  "Groceries",
  "Transport",
  "Utilities",
  "Dining",
  "Health",
  "Entertainment",
  "Shopping",
  "Other",
];

const form = document.getElementById("transactionForm");
const typeSelect = document.getElementById("type");
const amountInput = document.getElementById("amount");
const categorySelect = document.getElementById("category");
const noteInput = document.getElementById("note");
const dateInput = document.getElementById("date");
const listEl = document.getElementById("transactionList");
const summaryEl = document.getElementById("categorySummary");
const totalIncomeEl = document.getElementById("totalIncome");
const totalExpensesEl = document.getElementById("totalExpenses");
const balanceEl = document.getElementById("balance");
const typeFilter = document.getElementById("typeFilter");
const searchInput = document.getElementById("search");
const summaryFilter = document.getElementById("summaryFilter");
const clearAllBtn = document.getElementById("clearAllBtn");

let transactions = loadTransactions();

function loadTransactions() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function setCategoryOptions(type) {
  const list = type === "income" ? incomeCategories : expenseCategories;
  categorySelect.innerHTML = "";
  list.forEach((item) => {
    const option = document.createElement("option");
    option.value = item;
    option.textContent = item;
    categorySelect.appendChild(option);
  });
}

function getFilteredTransactions() {
  const filter = typeFilter.value;
  const query = searchInput.value.trim().toLowerCase();

  return transactions.filter((tx) => {
    const matchesType = filter === "all" ? true : tx.type === filter;
    const matchesQuery = query
      ? tx.note.toLowerCase().includes(query) ||
        tx.category.toLowerCase().includes(query)
      : true;
    return matchesType && matchesQuery;
  });
}

function renderTransactions() {
  const filtered = getFilteredTransactions();
  listEl.innerHTML = "";

  if (!filtered.length) {
    listEl.innerHTML =
      '<p class="label">No transactions yet. Add one above.</p>';
    return;
  }

  filtered
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .forEach((tx) => {
      const item = document.createElement("div");
      item.className = `transaction ${tx.type}`;
      item.innerHTML = `
        <div class="meta">
          <strong>${tx.note || "Untitled"}</strong>
          <p>${tx.category} • ${new Date(tx.date).toLocaleDateString()}</p>
        </div>
        <div class="actions">
          <span class="pill">${tx.type}</span>
          <span class="amount">${formatCurrency(tx.amount)}</span>
          <button class="delete-btn" data-id="${tx.id}">Delete</button>
        </div>
      `;
      listEl.appendChild(item);
    });
}

function updateSummary() {
  const totals = transactions.reduce(
    (acc, tx) => {
      if (tx.type === "income") acc.income += tx.amount;
      if (tx.type === "expense") acc.expense += tx.amount;
      return acc;
    },
    { income: 0, expense: 0 }
  );

  totalIncomeEl.textContent = formatCurrency(totals.income);
  totalExpensesEl.textContent = formatCurrency(totals.expense);
  const balance = totals.income - totals.expense;
  balanceEl.textContent = formatCurrency(balance);
  balanceEl.style.color = balance >= 0 ? "#16a34a" : "#dc2626";
}

function updateCategorySummary() {
  const filter = summaryFilter.value;
  const filtered =
    filter === "all"
      ? transactions
      : transactions.filter((tx) => tx.type === filter);

  const grouped = filtered.reduce((acc, tx) => {
    acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
    return acc;
  }, {});

  summaryEl.innerHTML = "";

  const entries = Object.entries(grouped).sort((a, b) => b[1] - a[1]);
  if (!entries.length) {
    summaryEl.innerHTML =
      '<p class="label">No category data yet.</p>';
    return;
  }

  entries.forEach(([category, amount]) => {
    const row = document.createElement("div");
    row.className = "summary-item";
    row.innerHTML = `
      <span>${category}</span>
      <strong>${formatCurrency(amount)}</strong>
    `;
    summaryEl.appendChild(row);
  });
}

function refreshUI() {
  updateSummary();
  renderTransactions();
  updateCategorySummary();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const amount = Number.parseFloat(amountInput.value);

  if (!amount || amount <= 0) {
    amountInput.focus();
    return;
  }

  const transaction = {
    id: crypto.randomUUID(),
    type: typeSelect.value,
    amount,
    category: categorySelect.value,
    note: noteInput.value.trim(),
    date: dateInput.value,
  };

  transactions.unshift(transaction);
  saveTransactions();
  form.reset();
  dateInput.value = new Date().toISOString().split("T")[0];
  setCategoryOptions(typeSelect.value);
  refreshUI();
});

listEl.addEventListener("click", (event) => {
  const button = event.target.closest(".delete-btn");
  if (!button) return;
  const id = button.dataset.id;
  transactions = transactions.filter((tx) => tx.id !== id);
  saveTransactions();
  refreshUI();
});

typeSelect.addEventListener("change", () => {
  setCategoryOptions(typeSelect.value);
});

typeFilter.addEventListener("change", renderTransactions);
searchInput.addEventListener("input", renderTransactions);
summaryFilter.addEventListener("change", updateCategorySummary);

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    if (typeof logout === "function") logout();
    window.location.replace("login.html");
  });
}

clearAllBtn.addEventListener("click", () => {
  if (transactions.length === 0) return;
  const confirmed = window.confirm("Clear all saved transactions?");
  if (!confirmed) return;
  transactions = [];
  saveTransactions();
  refreshUI();
});

dateInput.value = new Date().toISOString().split("T")[0];
setCategoryOptions(typeSelect.value);
refreshUI();

/* ----- Investment Calculator ----- */
const investmentForm = document.getElementById("investmentForm");
const principalInput = document.getElementById("principal");
const rateInput = document.getElementById("rate");
const timeValueInput = document.getElementById("timeValue");
const timeUnitSelect = document.getElementById("timeUnit");
const compoundSelect = document.getElementById("compound");
const investmentNoteInput = document.getElementById("investmentNote");
const investmentResultsEl = document.getElementById("investmentResults");
const investmentResultsContent = document.getElementById("investmentResultsContent");
const maturityValueEl = document.getElementById("maturityValue");
const totalInterestEl = document.getElementById("totalInterest");
const roiEl = document.getElementById("roi");
const saveInvestmentBtn = document.getElementById("saveInvestmentBtn");
const savedInvestmentsList = document.getElementById("savedInvestmentsList");

let lastCalculation = null;
let savedInvestments = loadInvestments();

function loadInvestments() {
  const raw = localStorage.getItem(INVESTMENTS_STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveInvestments() {
  localStorage.setItem(INVESTMENTS_STORAGE_KEY, JSON.stringify(savedInvestments));
}

function calculateCompoundInterest(principal, annualRatePercent, timeYears, compoundsPerYear) {
  const r = annualRatePercent / 100;
  const maturity = principal * Math.pow(1 + r / compoundsPerYear, compoundsPerYear * timeYears);
  const interest = maturity - principal;
  const roi = principal > 0 ? ((maturity - principal) / principal) * 100 : 0;
  return { maturity, interest, roi };
}

function renderSavedInvestments() {
  savedInvestmentsList.innerHTML = "";
  if (!savedInvestments.length) {
    savedInvestmentsList.innerHTML = '<p class="label">No saved investments yet.</p>';
    return;
  }
  savedInvestments
    .sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt))
    .forEach((inv) => {
      const item = document.createElement("div");
      item.className = "investment-item";
      item.innerHTML = `
        <div class="meta">
          <strong>${inv.label || "Investment"}</strong>
          <p>${formatCurrency(inv.principal)} @ ${inv.rate}% for ${inv.timeDisplay} • ${inv.compoundLabel}</p>
        </div>
        <div class="actions">
          <span class="amount" style="color: #16a34a">${formatCurrency(inv.maturity)}</span>
          <button class="delete-btn" data-inv-id="${inv.id}">Delete</button>
        </div>
      `;
      savedInvestmentsList.appendChild(item);
    });
}

savedInvestmentsList.addEventListener("click", (event) => {
  const btn = event.target.closest(".delete-btn");
  if (!btn?.dataset.invId) return;
  savedInvestments = savedInvestments.filter((i) => i.id !== btn.dataset.invId);
  saveInvestments();
  renderSavedInvestments();
});

investmentForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const principal = Number.parseFloat(principalInput.value);
  const rate = Number.parseFloat(rateInput.value);
  const timeValue = Number.parseFloat(timeValueInput.value);
  const timeUnit = timeUnitSelect.value;
  const compoundsPerYear = Number.parseInt(compoundSelect.value, 10);

  if (!principal || principal <= 0 || !rate || rate < 0) return;

  const timeYears = timeUnit === "months" ? timeValue / 12 : timeValue;
  const { maturity, interest, roi } = calculateCompoundInterest(
    principal,
    rate,
    timeYears,
    compoundsPerYear
  );

  const compoundLabels = { 1: "Annually", 2: "Semi-annually", 4: "Quarterly", 12: "Monthly" };
  const timeDisplay = timeUnit === "months" ? `${timeValue} months` : `${timeValue} years`;

  lastCalculation = {
    principal,
    rate,
    timeYears,
    timeValue,
    timeUnit,
    timeDisplay,
    compoundLabel: compoundLabels[compoundsPerYear] || "Monthly",
    compoundsPerYear,
    maturity,
    interest,
    roi,
    label: investmentNoteInput.value.trim(),
  };

  maturityValueEl.textContent = formatCurrency(maturity);
  totalInterestEl.textContent = formatCurrency(interest);
  roiEl.textContent = roi.toFixed(2) + "%";

  investmentResultsContent.classList.remove("hidden");
});

saveInvestmentBtn.addEventListener("click", () => {
  if (!lastCalculation) return;
  const inv = {
    id: crypto.randomUUID(),
    ...lastCalculation,
    savedAt: new Date().toISOString(),
  };
  savedInvestments.unshift(inv);
  saveInvestments();
  renderSavedInvestments();
});

renderSavedInvestments();
}
