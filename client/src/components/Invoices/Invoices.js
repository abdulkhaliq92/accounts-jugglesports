import React, { useMemo, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory, useLocation } from "react-router-dom";
import { deleteInvoice, getInvoicesByUser } from "../../actions/invoiceActions";
import NoData from "../svgIcons/NoData";
import Spinner from "../Spinner/Spinner";
import { useSnackbar } from "react-simple-snackbar";

/**
 * All Invoices (Redux-wired)
 * - Uses your real invoice shape from the provided code:
 *   { _id, invoiceNumber, client.name, currency, total, dueDate, status }
 * - Pure CSS (no UI libs). Responsive: table on desktop, cards on small screens
 * - Search + Filters (Status/Currency/Date Range) + Sort + Pagination
 * - Hooks into your existing actions (getInvoicesByUser, deleteInvoice)
 */

function formatMoney(value, currency = "USD", locale = undefined) {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Number(value ?? 0));
  } catch {
    const n = Number(value ?? 0).toFixed(2);
    return `${currency} ${n}`;
  }
}

function formatDate(value, locale = undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, { year: "numeric", month: "short", day: "2-digit" }).format(d);
}

const STATUS_OPTIONS = ["All", "Paid", "Partial", "Unpaid"];
const SORT_OPTIONS = [
  { key: "dueDate", label: "Due date" },
  { key: "total", label: "Amount" },
  { key: "client", label: "Client" },
  { key: "invoiceNumber", label: "Invoice #" },
  { key: "status", label: "Status" },
];

export default function Invoices() {
  const dispatch = useDispatch();
  const location = useLocation();
  const history = useHistory();
  const [openSnackbar] = useSnackbar();

  const rows = useSelector((state) => state.invoices.invoices) || [];
  const isLoading = useSelector((state) => state.invoices.isLoading);

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("profile")); } catch { return null; }
  }, []);

  useEffect(() => { if (!user) history.push("/login"); }, [user, history]);

  // Fetch invoices for this user (supports _id or googleId)
  useEffect(() => {
    const id = user?.result?._id || user?.result?.googleId;
    if (id) dispatch(getInvoicesByUser({ search: id }));
  }, [dispatch, location, user?.result?._id, user?.result?.googleId]);

  // --- UI state ---
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [currency, setCurrency] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  // const [sortKey, setSortKey] = useState("dueDate");
  // const [sortDir, setSortDir] = useState("asc");
  const [sortKey, setSortKey] = useState("dueDate");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const currencyList = useMemo(() => [
    "All",
    ...Array.from(new Set(rows.map((r) => r?.currency).filter(Boolean))).sort(),
  ], [rows]);

  useEffect(() => { setPage(0); }, [query, status, currency, dateFrom, dateTo, sortKey, sortDir, pageSize]);

  // Normalized helpers for sorting
  const getClient = (r) => r?.client?.name ?? "";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : null;

    return rows.filter((r) => {
      if (status !== "All" && r.status !== status) return false;
      if (currency !== "All" && r.currency !== currency) return false;

      if (from && new Date(r.dueDate) < from) return false;
      if (to && new Date(r.dueDate) > to) return false;

      if (!q) return true;
      const text = `${r.invoiceNumber ?? ""} ${getClient(r)} ${r?.notes ?? ""}`.toLowerCase();
      return text.includes(q);
    });
  }, [rows, status, currency, dateFrom, dateTo, query]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      let A; let B;
      switch (sortKey) {
        case "total":
          A = Number(a.total ?? 0); B = Number(b.total ?? 0); break;
        case "dueDate":
          A = new Date(a.dueDate).getTime(); B = new Date(b.dueDate).getTime(); break;
        case "client":
          A = getClient(a); B = getClient(b); break;
        case "invoiceNumber":
          A = String(a.invoiceNumber ?? ""); B = String(b.invoiceNumber ?? ""); break;
        case "status":
          A = String(a.status ?? ""); B = String(b.status ?? ""); break;
        default:
          A = 0; B = 0;
      }
      if (typeof A === "number" && typeof B === "number") return (A - B) * dir;
      return String(A).localeCompare(String(B)) * dir;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const pageCount = useMemo(() => (pageSize === -1 ? 1 : Math.ceil(sorted.length / pageSize) || 1), [sorted.length, pageSize]);
  const pageData = useMemo(() => {
    if (pageSize === -1) return sorted;
    const start = page * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const openInvoice = (id) => history.push(`/invoice/${id}`);
  const editInvoice = (id) => history.push(`/edit/invoice/${id}`);
  // const removeInvoice = (id) => dispatch(deleteInvoice(id, openSnackbar));
  const removeInvoice = (id) => {
    if (window.confirm("Delete this invoice? This cannot be undone.")) {
      dispatch(deleteInvoice(id, openSnackbar));
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', paddingTop: 20 }}>
        <Spinner />
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', paddingTop: 20, margin: 80 }}>
        <NoData />
        <p style={{ padding: 40, color: 'gray', textAlign: 'center' }}>
          No invoice yet. Click the plus icon to create invoice
        </p>
      </div>
    );
  }

  return (
    <div className="inv-wrap">
      <style>{css}</style>

      <header className="inv-header">
        <div className="title-group">
          <h1>All Invoices</h1>
          <p className="subtitle">Search, filter, and manage your invoices at a glance.</p>
        </div>
      </header>

      <section className="toolbar" aria-label="Invoice filters and search">
        <div className="search">
          <span className="icon" aria-hidden>🔎</span>
          <input
            type="text"
            placeholder="Search by number, client, or notes"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search invoices"
          />
        </div>

        <div className="filters">
          <label className="field">
            <span>Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Currency</span>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} aria-label="Filter by currency">
              {currencyList.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>From</span>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </label>

          <label className="field">
            <span>To</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </label>

          <label className="field">
            <span>Sort by</span>
            <select value={sortKey} onChange={(e) => setSortKey(e.target.value)} aria-label="Sort by">
              {SORT_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Direction</span>
            <select value={sortDir} onChange={(e) => setSortDir(e.target.value)} aria-label="Sort direction">
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </label>

          <label className="field">
            <span>Rows</span>
            <select value={pageSize} onChange={(e) => setPageSize(parseInt(e.target.value, 10))} aria-label="Rows per page">
              {[5, 10, 25, 50, -1].map((n) => (
                <option key={n} value={n}>{n === -1 ? "All" : n}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {/* Desktop/Table view */}
      <div className="table-outer" role="region" aria-label="Invoices table" tabIndex={0}>
        <table className="table">
          <thead>
            <tr>
              <th onClick={() => toggleSort("invoiceNumber")} role="button" tabIndex={0}>#</th>
              <th onClick={() => toggleSort("client")} role="button" tabIndex={0}>Client</th>
              <th onClick={() => toggleSort("total")} role="button" tabIndex={0}>Amount</th>
              <th onClick={() => toggleSort("dueDate")} role="button" tabIndex={0}>Due</th>
              <th onClick={() => toggleSort("status")} role="button" tabIndex={0}>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 && (
              <tr>
                <td colSpan={6} className="empty">No invoices match your filters.</td>
              </tr>
            )}
            {pageData.map((r) => (
              <tr key={r._id} onClick={() => openInvoice(r._id)}>
                <td data-label="#">{r.invoiceNumber ? "JS-"+r.invoiceNumber : "-"}</td>
                <td data-label="Client">{r?.client?.name ?? "N/A"}</td>
                <td data-label="Amount">{formatMoney(r.total, r.currency)}</td>
                <td data-label="Due">{formatDate(r.dueDate)}</td>
                <td data-label="Status"><span className={`pill ${String(r.status || '').toLowerCase()}`}>{r.status ?? "—"}</span></td>
                <td data-label="Actions" className="actions" onClick={(e) => e.stopPropagation()}>
                  <button className="btn btn-primary" onClick={() => openInvoice(r._id)}>Open</button>
                  <button className="btn btn-primary" onClick={() => editInvoice(r._id)}>Edit</button>
                  <button className="btn btn-primary danger" onClick={() => removeInvoice(r._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile/Card view */}
      <div className="cards">
        {pageData.length === 0 && (
          <div className="card empty-card">No invoices match your filters.</div>
        )}
        {pageData.map((r) => (
          <article key={r._id} className="card" onClick={() => openInvoice(r._id)}>
            <header className="card-head">
              <div className="card-title">{r.invoiceNumber ? "JS—"+r.invoiceNumber : "-"}</div>
              <span className={`pill ${String(r.status || '').toLowerCase()}`}>{r.status ?? "—"}</span>
            </header>
            <div className="card-body">
              <div className="row"><span>Client</span><strong>{r?.client?.name ?? "N/A"}</strong></div>
              <div className="row"><span>Amount</span><strong>{formatMoney(r.total, r.currency)}</strong></div>
              <div className="row"><span>Due</span><strong>{formatDate(r.dueDate)}</strong></div>
              {r.notes ? (<div className="notes" title={r.notes}>{r.notes}</div>) : null}
            </div>
            <footer className="card-actions" onClick={(e) => e.stopPropagation()}>
              <button className="btn" onClick={() => openInvoice(r._id)}>Open</button>
              <button className="btn" onClick={() => editInvoice(r._id)}>Edit</button>
              <button className="btn danger" onClick={() => removeInvoice(r._id)}>Delete</button>
            </footer>
          </article>
        ))}
      </div>

      {/* Pagination */}
      <nav className="pager" aria-label="Pagination">
        <div className="pager-info">
          {pageSize === -1 ? (
            <span>{sorted.length} total</span>
          ) : (
            <span>
              {sorted.length === 0 ? 0 : page * pageSize + 1}–{Math.min(sorted.length, (page + 1) * pageSize)} of {sorted.length}
            </span>
          )}
        </div>
        {pageSize !== -1 && (
          <div className="pager-controls">
            <button className="icon" disabled={page === 0} onClick={() => setPage(0)} aria-label="First page">⏮</button>
            <button className="icon" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} aria-label="Previous page">◀</button>
            <span className="page-num">Page {page + 1} / {pageCount}</span>
            <button className="icon" disabled={page >= pageCount - 1} onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))} aria-label="Next page">▶</button>
            <button className="icon" disabled={page >= pageCount - 1} onClick={() => setPage(pageCount - 1)} aria-label="Last page">⏭</button>
          </div>
        )}
      </nav>
    </div>
  );
}

const css = `
// :root{
//   --bg: #0b0d12;
//   --panel: #0f1219;
//   --muted: #a9b1c3;
//   --text: #e8eef8;
//   --line: #1a2130;
//   --accent: #6aa8ff;
//   --accent-2: #37d7b2;
//   --warn: #ffad66;
//   --danger: #ff6b6b;
//   --radius-xl: 16px;
//   --radius-lg: 12px;
//   --radius-md: 10px;
//   --shadow: 0 6px 24px rgba(0,0,0,0.35), 0 2px 6px rgba(0,0,0,0.25);
// }

*{box-sizing:border-box}
html,body,#root{height:100%}
body{margin:0;background:var(--bg);color:var(--text);font-family:ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial}

.inv-wrap{max-width:1200px;margin:0 auto;padding:32px 20px}

.inv-header{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:18px}
.inv-header h1{margin:0;font-weight:700;letter-spacing:0.3px;font-size:28px}
.subtitle{margin:6px 0 0;color:var(--muted);font-size:14px}

.toolbar{display:grid;grid-template-columns:1fr;gap:16px;background:var(--panel);border:1px solid var(--line);padding:14px;border-radius:var(--radius-xl);box-shadow:var(--shadow);}

.search{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.04);border:1px solid var(--line);padding:10px 12px;border-radius:12px}
.search .icon{opacity:.7}
.search input{flex:1;background:transparent;border:none;outline:none;color:var(--text);font-size:14px; padding:10px}
.search input::placeholder{color:#7e879a}

.filters{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:10px}
.field{display:flex;flex-direction:column;gap:6px;font-size:12px;color:var(--muted)}
.field select,.field input[type=date]{
  background:rgba(255,255,255,0.04);
  color:var(--text);
  border:1px solid var(--line);
  padding:10px 12px;
  border-radius:10px;
  outline:none;
}
.field select:focus,.field input[type=date]:focus{border-color:var(--accent)}

.table-outer{margin-top:16px;background:var(--panel);border:1px solid var(--line);border-radius:var(--radius-xl);box-shadow:var(--shadow);overflow:auto}
.table{width:100%;border-collapse:separate;border-spacing:0}
.table thead th{position:sticky;top:0;background:linear-gradient(180deg,#151a24, #0f1219);text-align:left;padding:14px 14px;border-bottom:1px solid var(--line);font-size:12px;color:#aab3c6;letter-spacing:.08em;text-transform:uppercase}
.table tbody td{padding:16px 14px;border-bottom:1px solid var(--line);font-size:14px}
.table tbody tr{transition:background .18s ease}
.table tbody tr:hover{background:rgba(255,255,255,0.03)}

.pill{display:inline-block;padding:6px 10px;border-radius:999px;font-size:12px;border:1px solid transparent}
.pill.paid{background:rgba(55,215,178,.12); color:#9ff4e1; border-color:rgba(55,215,178,.4)}
.pill.partial{background:rgba(106,168,255,.12); color:#c8dcff; border-color:rgba(106,168,255,.4)}
.pill.unpaid{background:rgba(255,173,102,.12); color:#ffd9b8; border-color:rgba(255,173,102,.4)}

.actions{display:flex;gap:10px}
.link{background:none;border:none;color:var(--accent);cursor:pointer;padding:0;font-size:14px}
.link:hover{text-decoration:underline}
.link.danger{color:var(--danger)}

.empty{padding:28px;text-align:center;color:var(--muted)}

/* Cards for mobile */
.cards{display:none;margin-top:16px}
.card{background:var(--panel);border:1px solid var(--line);border-radius:var(--radius-xl);box-shadow:var(--shadow);padding:14px}
.card + .card{margin-top:12px}
.card-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
.card-title{font-weight:600;letter-spacing:.2px}
.card-body{display:grid;gap:8px}
.card-body .row{display:flex;align-items:center;justify-content:space-between;color:var(--muted);font-size:13px}
.card-body .row strong{color:var(--text);font-size:14px}
.notes{margin-top:6px;color:#93a0b8;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.card-actions{margin-top:10px;display:flex;gap:8px}
.btn{background:rgba(255,255,255,0.05);border:1px solid var(--line);color:var(--text);border-radius:10px;padding:8px 10px;cursor:pointer}
.btn:hover{border-color:var(--accent)}
.btn.danger{border-color:rgba(255,107,107,.35);color:#ffc5c5}

/* Toolbar grid responsive */
@media (max-width: 1100px){
  .filters{grid-template-columns:repeat(4, minmax(0,1fr))}
}
@media (max-width: 800px){
  .filters{grid-template-columns:repeat(2, minmax(0,1fr))}
}

/* Switch to cards on small screens */
@media (max-width: 680px){
  .table-outer{display:none}
  .cards{display:block}
  .toolbar{gap:12px}
}

/* Focus states for accessibility */
[role="button"], button, select, input{ outline: none; }
[role="button"]:focus, button:focus, select:focus, input:focus{
  box-shadow: 0 0 0 3px rgba(106,168,255,.35);
  border-radius: 8px;
}

.pager{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:14px;padding:10px;border-radius:12px;border:1px solid var(--line);background:var(--panel)}
.pager-info{color:var(--muted);font-size:13px}
.pager-controls{display:flex;align-items:center;gap:8px}
.icon{background:rgba(255,255,255,0.05);border:1px solid var(--line);border-radius:8px;padding:6px 8px;color:var(--text);cursor:pointer}
.icon:disabled{opacity:.35;cursor:not-allowed}
.page-num{color:var(--muted);font-size:13px}
`;
