/**
 * Calculator frontend application logic.
 */

function resolveApiBase() {
  const configured =
    typeof window.CALCULATOR_API_BASE === "string" ? window.CALCULATOR_API_BASE.trim() : "";
  if (configured) return configured.replace(/\/+$/, "");
  if (location.protocol === "http:" || location.protocol === "https:") {
    return `${location.protocol}//${location.hostname || "127.0.0.1"}:8000`;
  }
  return "http://127.0.0.1:8000";
}

const API_BASE = resolveApiBase();
const MAX_EXPR_LEN = 256;

const exprView = document.getElementById("exprView");
const resultView = document.getElementById("resultView");
const errorView = document.getElementById("errorView");
const historyList = document.getElementById("historyList");
const historyEmpty = document.getElementById("historyEmpty");
const apiStatus = document.getElementById("apiStatus");

let expression = "";
let lastResult = null;
let justEvaluated = false;
let isCalculating = false;

const displayMap = {
  "*": "×",
  "/": "÷",
  "-": "−",
};

function showError(message) {
  errorView.hidden = false;
  errorView.textContent = message;
}

function clearError() {
  errorView.hidden = true;
  errorView.textContent = "";
}

function prettyExpr(text) {
  return text
    .split("")
    .map((ch) => displayMap[ch] || ch)
    .join("");
}

function renderDisplay() {
  if (justEvaluated && lastResult !== null) {
    exprView.textContent = `${prettyExpr(expression)} =`;
    resultView.textContent = String(lastResult);
    return;
  }
  exprView.textContent = expression ? prettyExpr(expression) : "\u00A0";
  if (lastResult !== null) {
    resultView.textContent = String(lastResult);
    return;
  }
  resultView.textContent = expression ? prettyExpr(expression) : "0";
}

function setApiStatus(ok, text) {
  apiStatus.textContent = `API Status: ${text}`;
  apiStatus.parentElement.classList.toggle("ok", ok);
  apiStatus.parentElement.classList.toggle("bad", !ok);
}

async function api(path, options = {}) {
  const resp = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const body = await resp.json().catch(() => null);
  return { resp, body };
}

function messageFromBody(resp, body) {
  if (body && typeof body.message === "string" && body.message) {
    return body.message;
  }
  return `Request failed (HTTP ${resp.status})`;
}

function appendValue(token) {
  clearError();
  if (justEvaluated) {
    if (/[0-9.]/.test(token) || token === "(") {
      expression = "";
      lastResult = null;
    } else if (lastResult !== null) {
      expression = String(lastResult);
      lastResult = null;
    }
    justEvaluated = false;
  }
  if (expression.length + token.length > MAX_EXPR_LEN) {
    showError(`Maximum expression length (${MAX_EXPR_LEN}) reached`);
    return;
  }
  expression += token;
  lastResult = null;
  renderDisplay();
}

function backspace() {
  clearError();
  if (justEvaluated) {
    justEvaluated = false;
    lastResult = null;
  }
  expression = expression.slice(0, -1);
  renderDisplay();
}

function allClear() {
  clearError();
  expression = "";
  lastResult = null;
  justEvaluated = false;
  renderDisplay();
}

function toggleSign() {
  clearError();
  if (justEvaluated && lastResult !== null) {
    expression = lastResult < 0 ? String(Math.abs(lastResult)) : `-${lastResult}`;
    lastResult = null;
    justEvaluated = false;
    renderDisplay();
    submitExpression();
    return;
  }
  if (!expression) {
    expression = "-";
    renderDisplay();
    return;
  }

  // Toggle wrapped negative number: e.g. "(-12)" -> "12"
  const wrappedMatch = expression.match(/\(-(\d+\.?\d*)\)$/);
  if (wrappedMatch) {
    expression = expression.slice(0, wrappedMatch.index) + wrappedMatch[1];
    renderDisplay();
    return;
  }

  // Toggle plain trailing number: e.g. "12" -> "(-12)"
  const numMatch = expression.match(/(\d+\.?\d*)$/);
  if (numMatch) {
    const num = numMatch[1];
    const prefix = expression.slice(0, expression.length - num.length);
    if (prefix.endsWith("-")) {
      expression = prefix.slice(0, -1) + num;
    } else {
      expression = `${prefix}(-${num})`;
    }
    renderDisplay();
  }
}

function applyPercent() {
  clearError();
  if (justEvaluated && lastResult !== null) {
    expression = `(${lastResult})/100`;
    lastResult = null;
    justEvaluated = false;
    renderDisplay();
    submitExpression();
    return;
  }
  if (!expression) return;

  const numMatch = expression.match(/(\d+\.?\d*)$/);
  if (numMatch) {
    const num = numMatch[1];
    const prefix = expression.slice(0, expression.length - num.length);
    expression = `${prefix}(${num}/100)`;
    renderDisplay();
  }
}

async function loadHistory() {
  try {
    const { resp, body } = await api("/api/history");
    if (!resp.ok) {
      setApiStatus(false, messageFromBody(resp, body));
      historyEmpty.hidden = true;
      showError("Failed to load history: " + messageFromBody(resp, body));
      return;
    }
    setApiStatus(true, "Connected to backend");
    renderHistory(body.history || []);
  } catch {
    setApiStatus(false, "Cannot connect to backend service");
    historyEmpty.hidden = true;
    showError("Failed to load history: cannot connect to backend");
  }
}

function renderHistory(items) {
  historyList.innerHTML = "";
  historyEmpty.hidden = items.length > 0;
  if (items.length === 0) {
    historyEmpty.textContent = "No history records";
  }
  for (const item of items) {
    const li = document.createElement("li");
    li.className = "history-item";

    const main = document.createElement("div");
    main.className = "history-main";

    const exprDiv = document.createElement("div");
    exprDiv.className = "history-expr";
    exprDiv.textContent = prettyExpr(item.expression);

    const resDiv = document.createElement("div");
    resDiv.className = "history-result";
    resDiv.textContent = `= ${item.result}`;

    const timeDiv = document.createElement("div");
    timeDiv.className = "history-time";
    timeDiv.textContent = item.created_at || "";

    main.append(exprDiv, resDiv, timeDiv);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "del-btn";
    btn.textContent = "Delete";
    btn.addEventListener("click", () => deleteHistory(item.id));

    li.append(main, btn);
    historyList.appendChild(li);
  }
}

async function deleteHistory(id) {
  clearError();
  try {
    const { resp, body } = await api(`/api/history/${id}`, { method: "DELETE" });
    if (!resp.ok) {
      showError(messageFromBody(resp, body));
      return;
    }
    loadHistory();
  } catch {
    setApiStatus(false, "Cannot connect to backend service");
    showError("Delete failed: cannot connect to backend");
  }
}

async function clearAllHistory() {
  clearError();
  try {
    const { resp, body } = await api("/api/history", { method: "DELETE" });
    if (!resp.ok) {
      showError(messageFromBody(resp, body));
      return;
    }
    loadHistory();
  } catch {
    setApiStatus(false, "Cannot connect to backend service");
    showError("Clear failed: cannot connect to backend");
  }
}

async function submitExpression() {
  clearError();
  const source = expression.trim();
  if (!source) {
    showError("Please enter an expression");
    return;
  }
  if (isCalculating) return;

  isCalculating = true;
  try {
    const { resp, body } = await api("/api/calculate", {
      method: "POST",
      body: JSON.stringify({ expression: source }),
    });

    if (!resp.ok || !body || body.success !== true) {
      showError(messageFromBody(resp, body));
      lastResult = null;
      justEvaluated = false;
      renderDisplay();
      return;
    }

    lastResult = body.result;
    justEvaluated = true;
    expression = body.expression;
    renderDisplay();
    setApiStatus(true, "Connected to backend");
    loadHistory();
  } catch {
    setApiStatus(false, "Cannot connect to backend service");
    showError("Backend unavailable: cannot obtain calculation result");
    lastResult = null;
    justEvaluated = false;
    renderDisplay();
  } finally {
    isCalculating = false;
  }
}

document.querySelector(".calc-shell").addEventListener("click", (event) => {
  const btn = event.target.closest("button.key");
  if (!btn) return;
  const action = btn.dataset.action;
  const value = btn.dataset.value;

  if (value !== undefined) {
    appendValue(value);
    return;
  }
  switch (action) {
    case "ac":
      allClear();
      break;
    case "back":
      backspace();
      break;
    case "sign":
      toggleSign();
      break;
    case "percent":
      applyPercent();
      break;
    case "equals":
      submitExpression();
      break;
    default:
      break;
  }
});

document.getElementById("refreshHistory").addEventListener("click", loadHistory);
document.getElementById("clearHistory").addEventListener("click", clearAllHistory);

window.addEventListener("keydown", (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  const key = event.key;
  const target = event.target;

  if (target && target.tagName === "BUTTON" && key === "Enter") return;

  if (/^[0-9]$/.test(key) || key === "." || key === "(" || key === ")") {
    appendValue(key);
    return;
  }
  if (key === "+" || key === "-" || key === "*" || key === "/") {
    appendValue(key);
    return;
  }
  if (key === "Enter" || key === "=") {
    event.preventDefault();
    submitExpression();
    return;
  }
  if (key === "Backspace") {
    backspace();
    return;
  }
  if (key === "Escape") {
    allClear();
  }
});

renderDisplay();
loadHistory();
