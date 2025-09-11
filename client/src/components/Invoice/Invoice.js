// File: src/components/Invoice/Invoice.jsx
import React, { useState, useEffect, useMemo } from 'react';
import styles from './Invoice.module.css';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useHistory, useLocation } from 'react-router-dom';
import moment from 'moment';
import { toCommas } from '../../utils/utils';

// MUI bits you already use (kept for functionality)
import IconButton from '@material-ui/core/IconButton';
import DeleteOutlineRoundedIcon from '@material-ui/icons/DeleteOutlineRounded';
import DateFnsUtils from '@date-io/date-fns';
import { MuiPickersUtilsProvider, KeyboardDatePicker } from '@material-ui/pickers';
import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import Avatar from '@material-ui/core/Avatar';

import { initialState } from '../../initialState';
import currencies from '../../currencies.json';
import { createInvoice, getInvoice, updateInvoice } from '../../actions/invoiceActions';
import { getClientsByUser } from '../../actions/clientActions';
import AddClient from './AddClient';
import InvoiceType from './InvoiceType';
import axios from 'axios';
import Logo from '../svgIcons/Logo';

export default function Invoice() {
  const location = useLocation();
  const dispatch = useDispatch();
  const history = useHistory();
  const { id } = useParams();

  const [invoiceData, setInvoiceData] = useState(initialState);
  const [rates, setRates] = useState(0);
  const [vat, setVat] = useState(0);
  const [currency, setCurrency] = useState(currencies[0].value);
  const [subTotal, setSubTotal] = useState(0);
  const [total, setTotal] = useState(0);
  const [selectedDate, setSelectedDate] = useState(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const [client, setClient] = useState(null);
  const [type, setType] = useState('Invoice');
  const [status, setStatus] = useState('');
  const [open, setOpen] = useState(false);

  const { invoice } = useSelector((state) => state.invoices);
  const clients = useSelector((state) => state.clients.clients);

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('profile')); } catch { return null; }
  }, []);

  useEffect(() => { if (!user) history.push('/login'); }, [user, history]);

  // Prefetch next invoice number on create
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API}/invoices/count?searchQuery=${user?.result?._id}`);
        setInvoiceData((prev) => ({ ...prev, invoiceNumber: (Number(response.data) + 1).toString().padStart(3, '0') }));
      } catch (e) { /* ignore */ }
    };
    fetchCount();
    // eslint-disable-next-line
  }, [location]);

  useEffect(() => { dispatch(getInvoice(id)); }, [dispatch, id]);
  useEffect(() => { dispatch(getClientsByUser({ search: user?.result?._id || user?.result?.googleId })); }, [dispatch, user]);

  // Hydrate from existing invoice when editing
  useEffect(() => {
    if (invoice) {
      setInvoiceData(invoice);
      setRates(invoice.rates);
      setClient(invoice.client);
      setType(invoice.type);
      setStatus(invoice.status);
      setSelectedDate(invoice.dueDate);
      setCurrency(invoice.currency || currencies[0].value);
    }
  }, [invoice]);

  // Status inferred from type (as in your original)
  useEffect(() => { setStatus(type === 'Receipt' ? 'Paid' : 'Unpaid'); }, [type]);

  // Compute subtotal and totals when items/rates change
  useEffect(() => {
    const subtotal = (invoiceData.items || []).reduce((sum, it) => {
      const qty = Number(it.quantity || 0);
      const price = Number(it.unitPrice || 0);
      const disc = Number(it.discount || 0);
      const line = qty * price * (1 - disc / 100);
      return sum + (isFinite(line) ? line : 0);
    }, 0);
    setSubTotal(subtotal);
  }, [invoiceData.items]);

  useEffect(() => {
    const vatValue = (rates / 100) * subTotal;
    setVat(vatValue);
    setTotal(subTotal + vatValue);
  }, [rates, subTotal]);

  // Handlers
  const handleItemChange = (index, e) => {
    const values = [...invoiceData.items];
    values[index][e.target.name] = e.target.value;
    setInvoiceData({ ...invoiceData, items: values });
  };
  const addItem = (e) => { e.preventDefault(); setInvoiceData((s) => ({ ...s, items: [...s.items, { itemName: '', unitPrice: '', quantity: '', discount: '', amount: '' }] })); };
  const removeItem = (i) => { const next = [...invoiceData.items]; next.splice(i, 1); setInvoiceData({ ...invoiceData, items: next }); };

  const handleSave = (e) => {
    e.preventDefault();
    const payload = {
      ...invoiceData,
      subTotal,
      total,
      vat,
      rates,
      currency,
      dueDate: selectedDate,
      client,
      type,
      status,
      paymentRecords: invoice?.paymentRecords || [],
      creator: [user?.result?._id || user?.result?.googleId],
    };

    if (invoice) {
      dispatch(updateInvoice(invoice._id, payload));
      history.push(`/invoice/${invoice._id}`);
    } else {
      payload.invoiceNumber = `${Number(invoiceData.invoiceNumber) < 100 ? Number(invoiceData.invoiceNumber).toString().padStart(3, '0') : Number(invoiceData.invoiceNumber)}`;
      dispatch(createInvoice(payload, history));
    }
  };

  const currencyOptions = { options: currencies, getOptionLabel: (o) => o.label };
  const clientOptions = { options: clients, getOptionLabel: (o) => o?.name ?? '' };

  const CustomPaper = (props) => <Paper elevation={4} {...props} />;

  return (
    <div className={styles.page}>
      <form onSubmit={handleSave}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.brand}>
            <Logo className={styles.logo} />
            {/* <div className={styles.brandMeta}>
              <h1>Invoice</h1>
              <p className={styles.muted}>Create and manage a professional invoice</p>
            </div> */}
          </div>

          <div className={styles.numberBlock}>
            {/* <InvoiceType type={type} setType={setType} /> */}
            <label className={styles.fieldInline}>
              <span>Invoice #</span>
              <input
                className={styles.input}
                // value={invoiceData.invoiceNumber || ''}
                onChange={(e) => setInvoiceData({ ...invoiceData, invoiceNumber: e.target.value.replace(/[^0-9]/g, '') })}
                inputMode="numeric"
                maxLength={10}
              />
            </label>
          </div>
        </header>

        {/* Two-column layout */}
        <section className={styles.main}>
          {/* Left: form */}
          <div className={styles.left}>
            {/* Bill To + Status block */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3>Billing</h3>
                <span className={styles.badge + ' ' + styles[status.toLowerCase()]}>{status || '—'}</span>
              </div>
              <div className={styles.billTo}>
                <div className={styles.billToLeft}>
                  <label className={styles.label}>Bill to</label>
                  {client ? (
                    <div className={styles.clientBox}>
                      <strong>{client.name}</strong>
                      <span>{client.email}</span>
                      <span>{client.phone}</span>
                      <span>{client.address}</span>
                      <button type="button" className={styles.linkBtn} onClick={() => setClient(null)}>Change</button>
                    </div>
                  ) : (
                    <div className={styles.clientPicker}>
                      <Autocomplete
                        {...clientOptions}
                        PaperComponent={CustomPaper}
                        renderInput={(params) => (
                          <TextField {...params} label="Select Customer" variant="outlined" required={!invoice} />
                        )}
                        onChange={(_e, val) => setClient(val)}
                      />
                      <button type="button" className={styles.chip} onClick={() => setOpen(true)}>
                        <span className={styles.plus}>+</span> New Customer
                      </button>
                    </div>
                  )}
                </div>
                <div className={styles.billToRight}>
                  <div className={styles.metaRow}>
                    <span className={styles.label}>Date</span>
                    <span>{moment().format('MMM Do YYYY')}</span>
                  </div>
                  <div className={styles.metaRow}>
                    <span className={styles.label}>Due Date</span>
                    <MuiPickersUtilsProvider utils={DateFnsUtils}>
                      <KeyboardDatePicker
                        margin="normal"
                        id="due-date"
                        format="MM/dd/yyyy"
                        value={selectedDate}
                        onChange={(d) => setSelectedDate(d)}
                        KeyboardButtonProps={{ 'aria-label': 'change date' }}
                        inputVariant="outlined"
                      />
                    </MuiPickersUtilsProvider>
                  </div>
                </div>
              </div>
            </div>

            {/* Items table */}
            <div className={styles.card}>
              <div className={styles.cardHeader}><h3>Items</h3></div>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th className={styles.num}>Qty</th>
                      <th className={styles.num}>Price</th>
                      <th className={styles.num}>Disc(%)</th>
                      <th className={styles.num}>Amount</th>
                      <th className={styles.num}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(invoiceData.items || []).map((row, idx) => {
                      const qty = Number(row.quantity || 0);
                      const price = Number(row.unitPrice || 0);
                      const disc = Number(row.discount || 0);
                      const amount = qty * price * (1 - disc / 100);
                      return (
                        <tr key={idx}>
                          <td>
                            <input
                              className={styles.input}
                              type="text"
                              name="itemName"
                              placeholder="Item name or description"
                              value={row.itemName}
                              onChange={(e) => handleItemChange(idx, e)}
                            />
                          </td>
                          <td className={styles.num}>
                            <input className={styles.input} type="number" name="quantity" value={row.quantity} onChange={(e) => handleItemChange(idx, e)} />
                          </td>
                          <td className={styles.num}>
                            <input className={styles.input} type="number" name="unitPrice" value={row.unitPrice} onChange={(e) => handleItemChange(idx, e)} />
                          </td>
                          <td className={styles.num}>
                            <input className={styles.input} type="number" name="discount" value={row.discount} onChange={(e) => handleItemChange(idx, e)} />
                          </td>
                          <td className={styles.num}>
                            {formatMoney(isFinite(amount) ? amount : 0, currency)}
                          </td>
                          <td className={styles.num}>
                            <IconButton onClick={() => removeItem(idx)} aria-label="remove item">
                              <DeleteOutlineRoundedIcon style={{ width: 20, height: 20 }} />
                            </IconButton>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className={styles.addRow}>
                <button className={styles.addBtn} onClick={addItem}>+ Add item</button>
              </div>
            </div>

            {/* Notes */}
            <div className={styles.card}>
              <div className={styles.cardHeader}><h3>Notes / Payment Info</h3></div>
              <textarea
                className={styles.textarea}
                placeholder="Provide additional details or terms of service"
                value={invoiceData.notes}
                onChange={(e) => setInvoiceData({ ...invoiceData, notes: e.target.value })}
                rows={4}
              />
            </div>
          </div>

          {/* Right: sticky summary */}
          <aside className={styles.right}>
            <div className={styles.cardSticky}>
              <div className={styles.cardHeader}><h3>Summary</h3></div>

              <div className={styles.summaryRow}><span>Subtotal</span><strong>{formatMoney(subTotal, currency)}</strong></div>
              <div className={styles.summaryRow + ' ' + styles.compact}>
                <span>Tax Rate (%)</span>
                <input className={styles.input} style={{ width:"20%" }} type="number" value={rates} onChange={(e) => setRates(Number(e.target.value || 0))} />
              </div>
              <div className={styles.summaryRow}><span>VAT</span><strong>{formatMoney(vat, currency)}</strong></div>
              <div className={styles.divider} />
              <div className={styles.summaryRow + ' ' + styles.total}><span>Total</span><strong>{currency} {toCommas(total)}</strong></div>

              <div className={styles.divider} />
              <div className={styles.summaryRow + ' ' + styles.compact}>
                <span>Currency</span>
                <Autocomplete
                  {...currencyOptions}
                  PaperComponent={CustomPaper}
                  renderInput={(params) => <TextField {...params} label="Currency" variant="outlined" />}
                  onChange={(_e, val) => setCurrency(val?.value || currency)}
                />
              </div>

              <div className={styles.actions}>
                <Button variant="contained" color="primary" type="submit">Save and Continue</Button>
                {invoice && (
                  <Button variant="outlined" onClick={() => history.push(`/invoice/${invoice._id}`)}>Preview</Button>
                )}
              </div>
            </div>
          </aside>
        </section>
      </form>

      {/* Add Client modal (from your existing component) */}
      <AddClient setOpen={setOpen} open={open} />
    </div>
  );
}

function formatMoney(value, currency = 'USD', locale) {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 2 }).format(Number(value ?? 0));
  } catch {
    return `${currency} ${Number(value ?? 0).toFixed(2)}`;
  }
}
