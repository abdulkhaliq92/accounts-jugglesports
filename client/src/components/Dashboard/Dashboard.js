// Basic CSS + JS (no Tailwind, no shadcn)
// Works with your existing Redux store, actions, and utilities.

import React, { useEffect, useMemo } from "react";
import { useHistory, useLocation } from "react-router-dom"; // v6 note at bottom
import { useDispatch, useSelector } from "react-redux";

import { getInvoicesByUser } from "../../actions/invoiceActions";
import { toCommas } from "../../utils/utils";

import Empty from "../svgIcons/Empty";
import Spinner from "../Spinner/Spinner";
import Chart from "./Chart"; // optional; remove section if you don't want it
import { Check, Pie, Bag, Card as CardIcon, Clock, Frown } from "./Icons";

import "./Dashboard.css";

const Dashboard = () => {
  const location = useLocation();
  const history = useHistory(); // v6 => useNavigate
  const dispatch = useDispatch();

  const user = useMemo(() => JSON.parse(localStorage.getItem("profile")), []);
  const { invoices = [], isLoading } = useSelector((s) => s?.invoices || {});

  // Fetch invoices when route changes
  useEffect(() => {
    if (user?.result?._id || user?.result?.googleId) {
      dispatch(getInvoicesByUser({ search: user.result._id || user.result.googleId }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, dispatch]);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) history.push("/login");
  }, [user, history]);

  // ---------- Derivations ----------
  const overDue = useMemo(
    () =>
      invoices.filter((inv) => {
        const d = inv?.dueDate ? new Date(inv.dueDate) : null;
        return d && d <= new Date();
      }),
    [invoices]
  );

  const paymentHistory = useMemo(() => {
    const all = invoices
      .filter((inv) => Array.isArray(inv.paymentRecords) && inv.paymentRecords.length)
      .flatMap((inv) => inv.paymentRecords.map((r) => ({ ...r })));
    return all.sort((a, b) => {
      const A = a?.datePaid ? new Date(a.datePaid).getTime() : 0;
      const B = b?.datePaid ? new Date(b.datePaid).getTime() : 0;
      return B - A; // newest first
    });
  }, [invoices]);

  const totalPaid = useMemo(
    () => invoices.reduce((sum, inv) => sum + (Number(inv?.totalAmountReceived) || 0), 0),
    [invoices]
  );

  const totalAmount = useMemo(
    () => invoices.reduce((sum, inv) => sum + (Number(inv?.total) || 0), 0),
    [invoices]
  );

  const unpaidInvoice = useMemo(() => invoices.filter((i) => i.status === "Unpaid"), [invoices]);
  const paid = useMemo(() => invoices.filter((i) => i.status === "Paid"), [invoices]);
  const partial = useMemo(() => invoices.filter((i) => i.status === "Partial"), [invoices]);

  const pctPaid = totalAmount > 0 ? Math.min(100, Math.round((totalPaid / totalAmount) * 100)) : 0;

  const fmtDate = (iso) =>
    iso
      ? new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
      : "-";

  // ---------- States ----------
  if (isLoading) {
    return (
      <div className="dash-center">
        <Spinner />
      </div>
    );
  }

  if (!invoices?.length) {
    return (
      <div className="dash-center">
        <Empty />
        <p className="dash-muted">Nothing to display. Click the plus icon to start creating</p>
      </div>
    );
  }

  // ---------- Render ----------
  return (
    <div className="dash-page">
      {/* Header */}
      <header className="dash-header">
        <div>
          <h1 className="dash-title">Dashboard</h1>
          <p className="dash-sub">A quick overview of your invoices & payments</p>
        </div>
        <div className="dash-badge">{pctPaid}% paid</div>
      </header>

      {/* KPI Grid */}
      <section className="dash-kpis">
        <div className="dash-grid">
          <article className="dash-card">
            <div className="dash-card__head">
              <span className="dash-card__label">Payment Received</span>
              <span className="dash-card__icon"><Check /></span>
            </div>
            <div className="dash-card__value">{toCommas(totalPaid)}</div>
            <div className="dash-card__hint">All-time</div>
          </article>

          <article className="dash-card">
            <div className="dash-card__head">
              <span className="dash-card__label">Pending Amount</span>
              <span className="dash-card__icon"><Pie /></span>
            </div>
            <div className="dash-card__value">{toCommas(Math.max(totalAmount - totalPaid, 0))}</div>
            <div className="dash-progress">
              <div className="dash-progress__bar" style={{ width: `${Math.min(100 - pctPaid, 100)}%` }} />
            </div>
            <div className="dash-card__hint">{Math.max(100 - pctPaid, 0)}% outstanding</div>
          </article>

          <article className="dash-card">
            <div className="dash-card__head">
              <span className="dash-card__label">Total Amount</span>
              <span className="dash-card__icon"><CardIcon /></span>
            </div>
            <div className="dash-card__value">{toCommas(totalAmount)}</div>
            <div className="dash-card__hint">{invoices.length} invoices</div>
          </article>

          <article className="dash-card">
            <div className="dash-card__head">
              <span className="dash-card__label">Status</span>
              <span className="dash-card__icon"><Bag /></span>
            </div>
            <ul className="dash-list">
              <li><span className="dot dot--green" /> <span>Paid</span> <b>{paid.length}</b></li>
              <li><span className="dot dot--amber" /> <span>Partial</span> <b>{partial.length}</b></li>
              <li><span className="dot dot--rose" /> <span>Unpaid</span> <b>{unpaidInvoice.length}</b></li>
              <li><span className="dot dot--deep" /> <span>Overdue</span> <b>{overDue.length}</b></li>
            </ul>
          </article>
        </div>
      </section>

      {/* Chart (optional) */}
      {/* {paymentHistory.length > 0 && (
        <section className="dash-panel">
          <h2 className="dash-panel__title">Payments Over Time</h2>
          <div className="dash-panel__body">
            <Chart paymentHistory={paymentHistory} />
          </div>
        </section>
      )} */}

      {/* Recent Payments */}
      <section className="dash-panel">
        <h2 className="dash-panel__title">
          {paymentHistory.length ? "Recent Payments" : "No payment received yet"}
        </h2>

        {paymentHistory.length > 0 && (
          <div className="dash-tableWrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th />
                  <th>Paid By</th>
                  <th>Date Paid</th>
                  <th>Amount Paid</th>
                  <th>Payment Method</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {paymentHistory.slice(0, 10).map((r) => (
                  <tr className="dash-row" key={r?._id}>
                    <td>
                      <div className="dash-avatar">
                        {(r?.paidBy || "?").charAt(0).toUpperCase()}
                      </div>
                    </td>
                    <td className="dash-cell--name">{r?.paidBy || "-"}</td>
                    <td>{fmtDate(r?.datePaid)}</td>
                    <td className="dash-amt">{toCommas(Number(r?.amountPaid) || 0)}</td>
                    <td>{r?.paymentMethod || "-"}</td>
                    <td className="dash-note">{r?.note || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;

/* react-router-dom v6:
   import { useNavigate, useLocation } from "react-router-dom";
   const navigate = useNavigate();
   useEffect(() => { if (!user) navigate("/login"); }, [user, navigate]);
   // replace history.push("/login") with navigate("/login")
*/
