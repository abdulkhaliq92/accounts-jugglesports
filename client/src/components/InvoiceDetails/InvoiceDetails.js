import React, { useState, useEffect } from 'react'
// import "../../../node_modules/react-progress-button/react-progress-button.css"
import { useSnackbar } from 'react-simple-snackbar'
import { useLocation, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { initialState } from '../../initialState'
import { getInvoice } from '../../actions/invoiceActions'
import { toCommas } from '../../utils/utils'
import styles from './InvoiceDetails.module.css'
import moment from 'moment'
import { useHistory } from 'react-router-dom'
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import InputBase from '@material-ui/core/InputBase';
import { Container, Grid } from '@material-ui/core';
import Divider from '@material-ui/core/Divider';
import BorderColorIcon from '@material-ui/icons/BorderColor';
import MonetizationOnIcon from '@material-ui/icons/MonetizationOn';
import Spinner from '../Spinner/Spinner'

import ProgressButton from 'react-progress-button'
import axios from 'axios';
import { saveAs } from 'file-saver';
import Modal from '../Payments/Modal'
import PaymentHistory from './PaymentHistory'
import Logo from '../svgIcons/Logo'

const InvoiceDetails = () => {

    const location = useLocation()
    const [invoiceData, setInvoiceData] = useState(initialState)
    const [ rates, setRates] = useState(0)
    const [vat, setVat] = useState(0)
    const [currency, setCurrency] = useState('')
    const [subTotal, setSubTotal] = useState(0)
    const [total, setTotal] = useState(0)
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [ client, setClient] = useState([])
    const [type, setType] = React.useState('')
    const [status, setStatus ] = useState('')
    const [company, setCompany] = useState({})
    const { id } = useParams()
    const { invoice } = useSelector((state) => state.invoices)
    const dispatch = useDispatch()
    const history = useHistory()
    const [sendStatus, setSendStatus] = useState(null)
    const [downloadStatus, setDownloadStatus] = useState(null)
    // eslint-disable-next-line
    const [openSnackbar, closeSnackbar] = useSnackbar()
    const user = JSON.parse(localStorage.getItem('profile'))
    
    const useStyles = makeStyles((theme) => ({
        root: {
          display: 'flex',
          '& > *': {
            margin: theme.spacing(1),
          },
        },
        large: {
          width: theme.spacing(12),
          height: theme.spacing(12),
        },
        table: {
            minWidth: 650,
          },
    
        headerContainer: {
            // display: 'flex'
            paddingTop: theme.spacing(1),
            paddingLeft: theme.spacing(5),
            paddingRight: theme.spacing(1),
            backgroundColor: '#f2f2f2',
            borderRadius: '10px 10px 0px 0px'
        }
      }));
    

    const classes = useStyles()

    useEffect(() => {
        dispatch(getInvoice(id));
      },[id, dispatch, location]);

      useEffect(() => {
        if(invoice) {
            //Automatically set the default invoice values as the ones in the invoice to be updated
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

    //Get the total amount paid
    let totalAmountReceived = 0
    for(var i = 0; i < invoice?.paymentRecords?.length; i++) {
        totalAmountReceived += Number(invoice?.paymentRecords[i]?.amountPaid)
    }


  const editInvoice = (id) => {
    history.push(`/edit/invoice/${id}`)
  }

  const createAndDownloadPdf = () => {
    setDownloadStatus('loading')
    axios.post(`${process.env.REACT_APP_API}/create-pdf`, 
    { name: invoice.client.name,
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
      company: company,
  })
    .then(() => {
      return axios.get(`${process.env.REACT_APP_API}/fetch-pdf`, {
        responseType: 'blob',
      });
    })
    .then((res) => {
      const pdfBlob = new Blob([res.data], { type: 'application/pdf' });

      const fileName =
        invoice.client.name +
        ' - ' +
        moment(invoice.createdAt).format('DD-MM-YYYY') +
        '.pdf';

      saveAs(pdfBlob, fileName);
      setDownloadStatus('success');
    })
    .catch((error) => {
      console.error('Error:', error);

      // Handle the error and set download status to 'error'
      setDownloadStatus('error');
    });
  }


  //SEND PDF INVOICE VIA EMAIL
  const sendPdf = (e) => {
    e.preventDefault()
    setSendStatus('loading')
    axios.post(`${process.env.REACT_APP_API}/send-pdf`, 
    { name: invoice.client.name,
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
      company: company,
  })
  // .then(() => console.log("invoice sent successfully"))
  .then(() => setSendStatus('success'))
      .catch((error) => {
        console.log(error)
        setSendStatus('error')
      })
  }


const iconSize = {height: '18px', width: '18px', marginRight: '10px', color: 'gray'}
const [open, setOpen ] = useState(false)


  function checkStatus() {
    return totalAmountReceived >= total ? "green"
         : status === "Partial" ? "#1976d2"
         : status === "Paid" ? "green"
         : status === "Unpaid" ? "red"
         : "red";
}


if(!invoice) {
  return (
    <Spinner />
  )
}


    return (
        <div className={styles.PageLayout}>
           {invoice?.creator?.includes(user?.result?._id || user?.result?.googleId) && (
            <div className={styles.buttons}>
                  {/* <ProgressButton 
                    onClick={sendPdf} 
                    state={sendStatus}
                    onSuccess={()=> openSnackbar("Invoice sent successfully")}
                  >
                  Send to Customer
                  </ProgressButton> */}
              
                <ProgressButton style={{width: '200px'}}
                  onClick={createAndDownloadPdf} 
                  state={downloadStatus}>
                  Download PDF
                </ProgressButton>

                <button 
                className={styles.btn}  
                onClick={() => editInvoice(invoiceData._id)}
                > 
                <BorderColorIcon style={iconSize} 
                />
                Edit Invoice
                </button>

                <button 
                  // disabled={status === 'Paid' ? true : false}
                  className={styles.btn} 
                  onClick={() => setOpen((prev) => !prev)}> 
                  <MonetizationOnIcon style={iconSize} 
                /> 
                Receive Full/Partial Payment
                </button>
            </div>
             )}

             {invoice?.paymentRecords.length !== 0 && (
                <PaymentHistory paymentRecords={invoiceData?.paymentRecords} />
             )}
        
            <Modal open={open} setOpen={setOpen} invoice={invoice}/>
            <div className={styles.invoiceLayout}>
        <Container>
        
            <Grid container justifyContent="space-between" style={{padding: '30px 0px' }}>
            {!invoice?.creator?.includes(user?.result._id || user?.result?.googleId) ? 
            (
              <Grid item>
              </Grid>
            )
            : (
              <>
              {/* {company?.logo ? <img src={'https://i.postimg.cc/RFzbLWZ1/juggle-sports-logo.png'} style={{width:'100%'}} alt="Logo" className={styles.logo} /> 
              :
              <h2>{company?.name}</h2>
              } */}
              <Logo width={'100%'} />
              </>
                // <Grid item onClick={() => history.push('/settings')} style={{cursor: 'pointer'}}>
                //     {company?.logo ? <img src={'https://i.ibb.co/rQMLWds/juggle-sports-logo.png'} style={{width:'100%'}} alt="Logo" className={styles.logo} /> 
                //     :
                //     <h2>{company?.name}</h2>
                //     }
                // </Grid>
            )}
                {/* <Grid item style={{marginRight: 40, textAlign: 'right'}}>
                    <Typography style={{lineSpacing: 1, fontSize: 45, fontWeight: 700, color: 'gray'}} >{Number(total - totalAmountReceived) <= 0 ? 'Receipt' : type}</Typography>
                    <Typography variant="overline" style={{color: 'gray'}} >No: </Typography>
                    <Typography variant="body2">{invoiceData?.invoiceNumber}</Typography>
                </Grid> */}
            </Grid >
        </Container>
        <Divider />
        <Container>
            <Grid container justifyContent="space-between" style={{marginTop: '40px'}} >
                <Grid item>
                    {invoice?.creator?.includes(user?.result._id) && (
                      <Container style={{marginBottom: '20px'}}>
                        <Typography variant="overline" style={{color: 'gray'}} gutterBottom>From</Typography>
                        <Typography variant="subtitle2">{invoice?.businessDetails?.data?.data?.businessName}</Typography>
                        <Typography variant="body2">{invoice?.businessDetails?.data?.data?.email}</Typography>
                        <Typography variant="body2">{invoice?.businessDetails?.data?.data?.phoneNumber}</Typography>
                        <Typography variant="body2" gutterBottom>{invoice?.businessDetails?.data?.data?.address}</Typography>
                      </Container>
                    )}
                    <Container>
                        <Typography variant="overline" style={{color: 'gray', paddingRight: '3px'}} gutterBottom>Bill to</Typography>
                        <Typography variant="subtitle2" gutterBottom>{client.name}</Typography>
                        <Typography variant="body2" >{client?.email}</Typography>
                        <Typography variant="body2" >{client?.phone}</Typography>
                        <Typography variant="body2">{client?.address}</Typography>
                    </Container>
                </Grid>

                <Grid item style={{marginRight: 20, textAlign: 'right'}}>
                    <Typography variant="overline" style={{color: 'gray'}} >No: </Typography>
                    <Typography variant="body2">{invoiceData?.invoiceNumber}</Typography>
                    <Typography variant="overline" style={{color: 'gray'}} gutterBottom>Status</Typography>
                    <Typography variant="h6" gutterBottom style={{color: checkStatus()}}>{totalAmountReceived >= total ? 'Paid':status}</Typography>
                    <Typography variant="overline" style={{color: 'gray'}} gutterBottom>Date</Typography>
                    <Typography variant="body2" gutterBottom>{moment().format("MMM Do YYYY")}</Typography>
                    <Typography variant="overline" style={{color: 'gray'}} gutterBottom>Due Date</Typography>
                    <Typography variant="body2" gutterBottom>{selectedDate? moment(selectedDate).format("MMM Do YYYY") : '27th Sep 2021'}</Typography>
                    <Typography variant="overline" gutterBottom>Amount</Typography>
                    <Typography variant="h6" gutterBottom>{currency} {toCommas(total)}</Typography>
                </Grid>
            </Grid>
        </Container>

        <form>
            <div>

    <TableContainer component={Paper}>
      <Table className={classes.table} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>Item</TableCell>
            <TableCell >Qty</TableCell>
            <TableCell>Price</TableCell>
            <TableCell >Disc(%)</TableCell>
            <TableCell >Amount</TableCell>
           
          </TableRow>
        </TableHead>
        <TableBody>
          {invoiceData?.items?.map((itemField, index) => (
            <TableRow key={index}>
              <TableCell  scope="row" style={{width: '40%' }}> <InputBase style={{width: '100%'}} outline="none" sx={{ ml: 1, flex: 1 }} type="text" name="itemName" value={itemField.itemName} placeholder="Item name or description" readOnly /> </TableCell>
              <TableCell align="right"> <InputBase sx={{ ml: 1, flex: 1 }} type="number" name="quantity" value={itemField?.quantity} placeholder="0" readOnly /> </TableCell>
              <TableCell align="right"> <InputBase sx={{ ml: 1, flex: 1 }} type="number" name="unitPrice" value={itemField?.unitPrice} placeholder="0" readOnly /> </TableCell>
              <TableCell align="right"> <InputBase sx={{ ml: 1, flex: 1 }} type="number" name="discount"  value={itemField?.discount} readOnly /> </TableCell>
              <TableCell align="right"> <InputBase sx={{ ml: 1, flex: 1 }} type="number" name="amount"  value={(itemField?.quantity * itemField.unitPrice) - (itemField.quantity * itemField.unitPrice) * itemField.discount / 100} readOnly /> </TableCell>
              
              
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
                <div className={styles.addButton}>
                </div>
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
                        <h4 style={{color: "black", fontSize: "18px", lineHeight: "8px"}}>{currency} {toCommas(total - totalAmountReceived)}</h4>
                    </div>
                    
                </div>

                <div className={styles.note}>
                    <h4 style={{marginLeft: '-10px'}}>Note/Payment Info</h4>
                    <p style={{fontSize: '14px'}}>{invoiceData.notes}</p>
                </div>

            {/* <button className={styles.submitButton} type="submit">Save and continue</button> */}
        </form>
    </div>
        </div>
        
    )
}

export default InvoiceDetails
