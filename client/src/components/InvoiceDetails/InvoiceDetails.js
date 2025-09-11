import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useSnackbar } from 'react-simple-snackbar'
import { useLocation, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { initialState } from '../../initialState'
import { getInvoice } from '../../actions/invoiceActions'
import { toCommas } from '../../utils/utils'
import styles from './InvoiceDetails.module.css'
import moment from 'moment'
import { useHistory } from 'react-router-dom'
import { makeStyles } from '@material-ui/core/styles'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableContainer from '@material-ui/core/TableContainer'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import Paper from '@material-ui/core/Paper'
import Typography from '@material-ui/core/Typography'
import InputBase from '@material-ui/core/InputBase'
import { Container, Grid } from '@material-ui/core'
import Divider from '@material-ui/core/Divider'
import BorderColorIcon from '@material-ui/icons/BorderColor'
import MonetizationOnIcon from '@material-ui/icons/MonetizationOn'
import Spinner from '../Spinner/Spinner'
import axios from 'axios'
import Modal from '../Payments/Modal'
import PaymentHistory from './PaymentHistory'
import Logo from '../svgIcons/Logo'

const useStyles = makeStyles(() => ({
  table: { minWidth: 650 }
}))

const InvoiceDetails = () => {
  const location = useLocation()
  const classes = useStyles()
  const history = useHistory()
  const [openSnackbar] = useSnackbar()
  const { id } = useParams()
  const dispatch = useDispatch()
  const { invoice } = useSelector((state) => state.invoices)

  const [invoiceData, setInvoiceData] = useState(initialState)
  const [rates, setRates] = useState(0)
  const [vat, setVat] = useState(0)
  const [currency, setCurrency] = useState('')
  const [subTotal, setSubTotal] = useState(0)
  const [total, setTotal] = useState(0)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [client, setClient] = useState([])
  const [type, setType] = React.useState('')
  const [status, setStatus] = useState('')
  const [company, setCompany] = useState({})
  const [sendStatus, setSendStatus] = useState(null) // (kept if you still email PDFs server-side)
  const [open, setOpen] = useState(false)

  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('profile')) } catch { return null }
  }, [])

  // Ref to the printable area
  const invoiceRef = useRef(null)

  useEffect(() => {
    dispatch(getInvoice(id))
  }, [id, dispatch, location])

  useEffect(() => {
    if (invoice) {
      setInvoiceData(invoice)
      setRates(invoice.rates)
      setClient(invoice.client)
      setType(invoice.type)
      setStatus(invoice.status)
      setSelectedDate(invoice.dueDate)
      setVat(invoice.vat)
      setCurrency(invoice.currency)
      setSubTotal(invoice.subTotal)
      setTotal(invoice.total)
      setCompany(invoice?.businessDetails?.data?.data)
    }
  }, [invoice])

  // Total paid
  let totalAmountReceived = 0
  for (let i = 0; i < (invoice?.paymentRecords?.length || 0); i++) {
    totalAmountReceived += Number(invoice?.paymentRecords[i]?.amountPaid)
  }

  const editInvoice = (id) => {
    history.push(`/edit/invoice/${id}`)
  }

  // Optional: server-side email (kept as-is)
  const sendPdf = (e) => {
    e.preventDefault()
    setSendStatus('loading')
    axios.post(`${process.env.REACT_APP_API}/send-pdf`, {
      name: invoice.client.name,
      address: invoice.client.address,
      phone: invoice.client.phone,
      email: invoice.client.email,
      dueDate: invoice.dueDate,
      date: invoice.createdAt,
      id: invoice.invoiceNumber,
      notes: invoice.notes,
      subTotal: toCommas(invoice.subTotal),
      total: toCommas(invoice.total),
      type: invoice.type,
      vat: toCommas(invoice.vat),
      items: invoice.items,
      status: invoice.status,
      totalAmountReceived: toCommas(totalAmountReceived),
      balanceDue: toCommas(total - totalAmountReceived),
      link: `${process.env.REACT_APP_URL}/invoice/${invoice._id}`,
      company: company
    })
      .then(() => openSnackbar('Invoice sent successfully'))
      .catch(() => openSnackbar('Failed to send invoice'))
      .finally(() => setSendStatus(null))
  }

  function checkStatus() {
    return totalAmountReceived >= total ? 'green'
      : status === 'Partial' ? '#1976d2'
      : status === 'Paid' ? 'green'
      : status === 'Unpaid' ? 'red'
      : 'red'
  }

  // 👉 Print only the invoice div
  const handlePrint = () => {
    // Wait a tick in case UI just changed
    setTimeout(() => window.print(), 0)
  }

  if (!invoice) {
    return <Spinner />
  }

  return (
    <div className={styles.PageLayout}>
      {/* Print-only CSS: hide everything except #invoicePrintable on print */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #invoicePrintable, #invoicePrintable * { visibility: visible !important; }
          #invoicePrintable { position: absolute; left: 0; top: 0; width: 100%; }
          /* Optional: remove box-shadows/backgrounds for cleaner PDF */
          .${styles.PageLayout} { background: #fff !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Actions (hidden on print by .no-print) */}
      {invoice?.creator?.includes(user?.result?._id || user?.result?.googleId) && (
        <div className={`no-print ${styles.actionBar}`} style={{ display: 'flex', gap: 12, marginBottom: 16, justifyContent: "center" }}>
          <button
            className={styles.pillBtn}
            onClick={handlePrint}
            aria-label="Print or save invoice as PDF"
          >
            🖨️ Print / Save as PDF
          </button>

          <button
            className={styles.pillBtn}
            onClick={() => editInvoice(invoiceData._id)}
            aria-label="Edit invoice"
          >
            <span className={styles.btnIcon}><BorderColorIcon style={{ fontSize: 18 }} /></span>
            Edit Invoice
          </button>

          <button
            className={`${styles.pillBtn} ${styles.successBtn}`}
            onClick={() => setOpen((prev) => !prev)}
            aria-label="Record payment"
          >
            <span className={styles.btnIcon}><MonetizationOnIcon style={{ fontSize: 18 }} /></span>
            Receive Full/Partial Payment
          </button>
        </div>
      )}

      <Modal open={open} setOpen={setOpen} invoice={invoice} />

      {/* ✅ Printable area */}
      <div id="invoicePrintable" className={styles.invoiceLayout} ref={invoiceRef}>
        <Container>
          <Grid container justifyContent="space-between" style={{ padding: '30px 0px' }}>
            {!invoice?.creator?.includes(user?.result._id || user?.result?.googleId)
              ? (<Grid item />)
              : (<Logo width={'100%'} />)}
          </Grid>
        </Container>

        <Divider />

        <Container>
          <Grid container justifyContent="space-between" style={{ marginTop: '40px' }}>
            <Grid item>
              {invoice?.creator?.includes(user?.result._id) && (
                <Container style={{ marginBottom: '20px' }}>
                  <Typography variant="overline" style={{ color: 'gray' }} gutterBottom>From</Typography>
                  {/* <Typography variant="subtitle2">{invoice?.businessDetails?.data?.data?.businessName}</Typography>
                  <Typography variant="body2">{invoice?.businessDetails?.data?.data?.email}</Typography>
                  <Typography variant="body2">{invoice?.businessDetails?.data?.data?.phoneNumber}</Typography>
                  <Typography variant="body2" gutterBottom>{invoice?.businessDetails?.data?.data?.address}</Typography> */}
                  <br></br>
                  <Logo style={{margin: "5px 0"}} width={'150px'} />
                  {/* <Typography variant="subtitle2">Juggle Sports</Typography> */}
                  <Typography variant="body2">Email: jugglesports@gmail.com</Typography>
                  <Typography variant="body2">Email: alnoorind@gmail.com</Typography>
                  <Typography variant="body2">Phone : 0092-52-3254839</Typography>
                  <Typography variant="body2">Mobile : 0092-300-6197726</Typography>
                  <Typography variant="body2">Mobile : 0092-347-4931430</Typography>
                  <Typography variant="body2" gutterBottom>Address: Defence Road Near PSO Pump Sialkot.(51310) PAKISTAN</Typography>
                </Container>
              )}
              <Container>
                <Typography variant="overline" style={{ color: 'gray', paddingRight: '3px' }} gutterBottom>Bill to</Typography>
                <Typography variant="subtitle2" gutterBottom>{client.name}</Typography>
                <Typography variant="body2">{client?.email}</Typography>
                <Typography variant="body2">{client?.phone}</Typography>
                <Typography variant="body2">{client?.address}</Typography>
              </Container>
            </Grid>

            <Grid item style={{ marginRight: 20, textAlign: 'right' }}>
              <Typography variant="overline" style={{ color: 'gray' }}>No: </Typography>
              <Typography variant="body2">JS-{invoiceData?.invoiceNumber}</Typography>
              <Typography variant="overline" style={{ color: 'gray' }} gutterBottom>Status</Typography>
              <Typography variant="h6" gutterBottom style={{ color: checkStatus() }}>{totalAmountReceived >= total ? 'Paid' : status}</Typography>
              <Typography variant="overline" style={{ color: 'gray' }} gutterBottom>Date</Typography>
              <Typography variant="body2" gutterBottom>{moment().format('MMM Do YYYY')}</Typography>
              <Typography variant="overline" style={{ color: 'gray' }} gutterBottom>Due Date</Typography>
              <Typography variant="body2" gutterBottom>{selectedDate ? moment(selectedDate).format('MMM Do YYYY') : '27th Sep 2021'}</Typography>
              <Typography variant="overline" gutterBottom>Amount</Typography>
              <Typography variant="h6" gutterBottom>{currency} {toCommas(total)}</Typography>
            </Grid>
          </Grid>
        </Container>

        <form>
          <div style={{marginTop: "10px"}}>
            <TableContainer component={Paper} elevation={0}>
              <Table className={classes.table} aria-label="simple table">
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell>Qty</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Disc(%)</TableCell>
                    <TableCell>Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoiceData?.items?.map((itemField, index) => (
                    <TableRow key={index}>
                      <TableCell scope="row" style={{ width: '40%' }}>
                        <InputBase
                          style={{ width: '100%' }}
                          type="text"
                          name="itemName"
                          value={itemField.itemName}
                          placeholder="Item name or description"
                          readOnly
                        />
                      </TableCell>
                      <TableCell align="right">
                        <InputBase type="number" name="quantity" value={itemField?.quantity} placeholder="0" readOnly />
                      </TableCell>
                      <TableCell align="right">
                        <InputBase type="number" name="unitPrice" value={itemField?.unitPrice} placeholder="0" readOnly />
                      </TableCell>
                      <TableCell align="right">
                        <InputBase type="number" name="discount" value={itemField?.discount} readOnly />
                      </TableCell>
                      <TableCell align="right">
                        <InputBase
                          type="number"
                          name="amount"
                          value={(itemField?.quantity * itemField.unitPrice) - (itemField.quantity * itemField.unitPrice) * itemField.discount / 100}
                          readOnly
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <div className={styles.addButton}></div>
          </div>

          <div className={styles.invoiceSummary}>
            <div className={styles.summary}>Invoice Summary</div>
            <div className={styles.summaryItem}>
              <p>Subtotal:</p>
              <h4>{subTotal}</h4>
            </div>
            <div className={styles.summaryItem}>
              <p>{`VAT(${rates}%):`}</p>
              <h4>{toCommas(vat)}</h4>
            </div>
            <div className={styles.summaryItem}>
              <p>Total</p>
              <h4>{currency} {toCommas(total)}</h4>
            </div>
            <div className={styles.summaryItem}>
              <p>Paid</p>
              <h4>{currency} {toCommas(totalAmountReceived)}</h4>
            </div>

            <div className={styles.summaryItem}>
              <p>Balance</p>
              <h4 style={{ color: 'black', fontSize: '18px', lineHeight: '8px' }}>
                {currency} {toCommas(total - totalAmountReceived)}
              </h4>
            </div>
          </div>

          <div className={styles.note}>
            <h4 style={{ marginLeft: '-10px' }}>Note/Payment Info</h4>
            <p style={{ fontSize: '14px' }}>{invoiceData.notes}</p>
          </div>

          {invoice?.paymentRecords?.length !== 0 && (
            <PaymentHistory paymentRecords={invoiceData?.paymentRecords} />
          )}
        </form>
      </div>
    </div>
  )
}

export default InvoiceDetails
