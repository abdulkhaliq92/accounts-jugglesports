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
import './PrintStyles.css'; // Import your print-specific styles

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


// const printInvoice = () => {
//   // Create a new jsPDF instance with A4 size (210x297 mm)
//   const pdf = new jsPDF();

//   // Create a simple test div
//   const testDiv = `
//   <!DOCTYPE html>
//   <html>
//   <head>
//   <style>
  
  // .invoice-container {
  //     margin: 0;
  //     padding: 0;
  //     padding-top: 10px;
  //     font-family: 'Roboto', sans-serif;
  //     width: 530px;
  //     margin: 0px auto;
  //     }
  
  // table {
  //   font-family: Arial, Helvetica, sans-serif;
  //   border-collapse: collapse;
  //   width: 100%;
  // }
  
  // table td, table th {
  //   border: 1px solid rgb(247, 247, 247);
  //   padding: 10px;
  // }
  
  // table tr:nth-child(even){background-color: #f8f8f8;}
  
  // table tr:hover {background-color: rgb(243, 243, 243);}
  
  // table th {
  //   padding-top: 12px;
  //   padding-bottom: 12px;
  //   text-align: left;
  //   background-color: #FFFFFF;
  //   color: rgb(78, 78, 78);
  // }
  
  // .address {
  //     display: flex;
  //     align-items: center;
  //     flex-direction: column;
  //     justify-content: space-between;
  //     padding: 10px 0px 15px 0px;
  //     line-height: 10px;
  //     font-size: 12px;
  //     margin-top: -20px
  
  // }
  
  // .status {
  //     text-align: right;
  // }
  // .receipt-id {
  //     text-align: right;
  // }
  
  // .title {
  //     font-weight: 100px;
  //     text-transform: uppercase;
  //     color: gray;
  //     letter-spacing: 2px;
  //     font-size: 8px;
  //     line-height: 5px;
  // }
  
  // .summary {
  //     margin-top: 2px;
  //     margin-right: 0px;
  //     margin-left: 50%;
  //     margin-bottom: 15px;
  // }
  
  // img {
  //     width: 80%;
  //    display: block;
  //    margin: 0 auto;
  // }
  
  // .header {
  //   display: flex;
  //   align-items: center;
  //   justify-content: space-between;
  //   padding: 10px 5px;
  // }
  
  // .header svg {
  //   display: block;
  //   height: 100%; /* Adjust the height as needed */
  // }
  
//   </style>
//   </head>
//   <body>
//   <div class="invoice-container">
//   <section  class="header">
//           <div>
//             <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xodm="http://www.corel.com/coreldraw/odm/2003" xml:space="preserve" version="1.1" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd" viewBox="29.03 332.97 1960.25 278.89"> <defs>  <style type="text/css">   <![CDATA[    .fil4 {fill:#858789}    .fil1 {fill:#373535}    .fil3 {fill:#F58735}    .fil2 {fill:#EC8A41}    .fil0 {fill:#373535;fill-rule:nonzero}   ]]>  </style> </defs> <g id="Layer_x0020_1">  <metadata id="CorelCorpID_0Corel-Layer"></metadata>  <g id="_105553204438336">   <path class="fil0" d="M569.99 540.93m49.88 -26.68c0,14.73 -0.69,24.18 -17.37,24.18 -10.14,0 -20.01,-10.15 -8.05,-13.62 6.39,-1.25 13.75,-5.42 13.75,-16.67 0,-10.98 -7.09,-19.87 -18.48,-19.87 -12.09,0 -19.73,10.97 -19.73,22.37 0,16.81 10.98,32.79 44.05,32.79 47.24,0 46.82,-25.85 46.82,-30.15l0 -31.55c0,-35.57 0.42,-36.12 9.59,-36.12 1.39,0 3.2,0 3.2,-1.95 0,-2.08 -2.23,-2.08 -3.48,-2.08l-63.08 0c-1.39,0 -2.92,0 -2.92,2.08 0,1.95 4.72,1.95 6.53,1.95 8.9,0 9.17,1.66 9.17,36.12l0 32.52zm50.16 26.68m3.62 -99.35c-1.25,0 -3.62,0 -3.62,1.8 0,2.23 2.64,2.23 4.03,2.23 9.45,0 9.87,1.94 9.87,36.12l0 34.33c-0.14,14.73 7.78,27.37 46.13,27.37 32.93,0 40.99,-10.7 40.99,-33.21l0 -19.45c0,-30.29 11.54,-45.16 19.6,-45.16 0.97,0 2.36,-0.42 2.36,-1.81 0,-2.22 -1.39,-2.22 -2.92,-2.22l-42.38 0c-1.53,0 -3.89,0 -3.89,1.94 0,1.95 2.08,2.09 3.61,2.09 10.01,0 19.59,15.28 19.59,40.99l0 23.76c0,18.34 -6.39,27.93 -24.31,27.93 -16.68,0 -17.79,-9.59 -17.79,-20.29l0 -36.27c0,-34.18 0.42,-36.12 9.87,-36.12 1.39,0 4.03,0 4.03,-2.23 0,-1.8 -2.37,-1.8 -3.62,-1.8l-61.55 0zm111.02 99.35m45.16 -56.69c0,-37.94 7.09,-41.13 17.23,-41.13 7.92,0 25.29,6.53 35.02,31.54 0.55,1.39 1.25,4.17 3.19,4.17 2.5,0 1.81,-3.34 1.67,-4.87l-2.78 -35.43c-0.28,-1.39 0,-5 -2.36,-5 -2.5,0 -3.61,8.06 -12.65,8.06 -1.66,0 -5.69,-0.56 -10.42,-1.25 -4.72,-0.7 -10.14,-1.25 -14.31,-1.25 -30.99,0 -59.75,21.67 -59.75,54.33 0,31.4 23.62,50.02 56.14,50.02 20.98,0 33.62,-6.25 41.27,-6.25 5.97,0 12.5,3.47 13.61,3.47 0.28,0 2.64,-0.56 1.11,-4.45 -1.8,-4.72 -2.22,-13.47 -2.22,-18.34 0,-8.2 1.11,-21.67 11.95,-21.67 1.53,0 2.78,-0.42 2.78,-2.23 0,-1.8 -2.92,-1.8 -6.25,-1.8l-57.94 0c-1.39,0 -3.34,0 -3.34,1.94 0,2.09 2.78,2.09 4.17,2.23 7.36,0.83 10.98,4.44 10.56,15.97l0 8.76c0,17.23 -5.56,18.34 -13.48,18.34 -10.14,0 -13.2,-2.22 -13.2,-29.04l0 -26.12zm78.51 56.69m45.16 -56.69c0,-37.94 7.09,-41.13 17.23,-41.13 7.92,0 25.29,6.53 35.01,31.54 0.56,1.39 1.25,4.17 3.2,4.17 2.5,0 1.81,-3.34 1.67,-4.87l-2.78 -35.43c-0.28,-1.39 0,-5 -2.36,-5 -2.51,0 -3.62,8.06 -12.65,8.06 -1.67,0 -5.69,-0.56 -10.42,-1.25 -4.72,-0.7 -10.14,-1.25 -14.31,-1.25 -30.99,0 -59.75,21.67 -59.75,54.33 0,31.4 23.62,50.02 56.14,50.02 20.98,0 33.62,-6.25 41.26,-6.25 5.98,0 12.51,3.47 13.62,3.47 0.28,0 2.64,-0.56 1.11,-4.45 -1.8,-4.72 -2.22,-13.47 -2.22,-18.34 0,-8.2 1.11,-21.67 11.95,-21.67 1.53,0 2.78,-0.42 2.78,-2.23 0,-1.8 -2.92,-1.8 -6.25,-1.8l-57.95 0c-1.39,0 -3.33,0 -3.33,1.94 0,2.09 2.78,2.09 4.17,2.23 7.36,0.83 10.97,4.44 10.56,15.97l0 8.76c0,17.23 -5.56,18.34 -13.48,18.34 -10.14,0 -13.2,-2.22 -13.2,-29.04l0 -26.12zm74.62 56.69m13.89 -40.16c0,34.18 -0.41,36.13 -9.86,36.13 -1.39,0 -4.03,0 -4.03,2.22 0,1.81 2.36,1.81 3.61,1.81l66.84 0c16.95,0 18.75,10.28 22.23,10.28 1.67,0 2.08,-3.06 2.22,-4.03l10.01 -39.6c0.55,-3.06 1.94,-6.53 -0.7,-6.53 -3.47,0 -3.89,9.17 -18.76,23.21 -5.56,5.55 -13.75,12.64 -22.23,12.64 -7.64,0 -8.34,-3.89 -8.34,-24.18l0 -30.99c0,-31.95 0,-36.12 11.4,-36.12 1.66,0 4.17,0 4.17,-1.67 0,-2.36 -4.03,-2.36 -5.7,-2.36l-61.14 0c-1.25,0 -3.61,0 -3.61,1.8 0,2.23 2.64,2.23 4.03,2.23 9.45,0 9.86,1.94 9.86,36.12l0 19.04zm86.01 40.16m54.89 -79.34c0.56,-13.76 2.5,-15.98 10.14,-15.98 14.87,0 28.49,18.2 33.77,30.57 0.42,1.11 1.81,5 3.47,5 2.09,0 1.81,-1.67 1.11,-6.39l-7.36 -38.35c-0.56,-4.59 -2.22,-4.59 -4.31,-2.09 -3.33,3.75 -7.78,6.67 -25.15,7.23l-62.94 0c-1.25,0 -3.62,0 -3.62,1.8 0,2.23 2.64,2.23 4.03,2.23 9.45,0 9.87,1.94 9.87,36.12l0 19.04c0,34.18 -0.42,36.13 -9.87,36.13 -1.39,0 -4.03,0 -4.03,2.22 0,1.81 2.37,1.81 3.62,1.81l62.94 0c23.9,0 25.57,3.89 28.49,7.78 1.25,1.67 3.19,1.95 4.03,-2.36l9.03 -44.74c0,-1.53 -2.22,-3.34 -4.31,1.52l-3.06 4.45c-7.08,10.98 -21.53,29.32 -35.85,29.32 -7.08,0 -10,-1.95 -10,-15.98l0 -32.38 4.03 0c9.73,0 17.51,4.59 17.79,18.76 0,7.09 4.02,6.12 4.02,1.67l0 -43.21c0,-3.62 -3.33,-5.01 -4.02,0.97 -1.67,14.03 -7.92,17.78 -17.79,17.78l-4.03 0 0 -22.92z"></path>   <path class="fil0" d="M1310.35 540.93m89.35 -105.05c-1.25,-6.53 -2.78,-5.84 -4.45,-2.08 -1.11,2.78 -3.61,7.78 -12.22,7.78 -2.64,0 -6.4,-0.56 -10.7,-1.25 -4.31,-0.7 -9.18,-1.25 -14.04,-1.25 -21.4,0 -46.83,8.33 -46.83,34.04 0,39.74 60.87,27.1 60.87,51.69 0,10.42 -8.76,14.59 -18.21,14.59 -22.23,0 -37.51,-27.79 -38.21,-30.15 -0.42,-1.39 -1.81,-4.31 -3.47,-4.31 -1.81,0 -2.09,1.25 -1.39,6.39l4.58 34.32c0.14,1.11 0,4.31 1.81,4.31 3.61,0 2.36,-8.48 15.01,-8.48 4.72,0 9.44,0.42 14.17,0.98 4.72,0.41 9.45,0.97 14.17,0.97 22.37,0 50.58,-10.98 50.58,-37.24 0,-18.34 -10.84,-26.12 -39.88,-35.71 -7.64,-2.5 -20.98,-6.11 -20.98,-16.4 0,-8.33 7.5,-10.97 14.59,-10.97 14.73,0 29.18,14.31 34.04,22.51 3.62,5.97 4.87,1.94 4.87,1.39l-4.31 -31.13zm11.39 105.05m54.89 -42.8c4.45,0 9.03,0.14 13.48,0 14.59,-0.41 51.13,2.23 51.13,-28.21 0,-28.34 -29.87,-28.34 -49.33,-28.34l-66.55 0c-1.25,0 -3.62,0 -3.62,1.8 0,2.23 2.64,2.23 4.03,2.23 9.45,0 9.87,1.94 9.87,36.12l0 19.04c0,34.18 -0.42,36.13 -9.87,36.13 -1.39,0 -4.03,0 -4.03,2.22 0,1.81 2.37,1.81 3.62,1.81l61.55 0c1.25,0 3.62,0 3.62,-1.81 0,-2.22 -2.64,-2.22 -4.03,-2.22 -9.45,0 -9.87,-1.95 -9.87,-36.13l0 -2.64zm0 -32.93c0,-17.37 1.67,-19.59 10,-19.59 10.43,0 12.23,4.44 12.23,11.67l0 19.45c0,13.48 -3.75,17.37 -10.97,17.37l-11.26 0 0 -28.9zm67.11 75.73m58.37 2.5c45.15,0 58.22,-31.82 58.22,-52.25 0,-20.28 -13.07,-52.1 -58.36,-52.1 -45.16,0 -58.23,31.82 -58.23,52.24 0,20.29 13.2,52.11 58.37,52.11zm-13.21 -76.15c0,-20.56 2.09,-24.17 13.21,-24.17 10.97,0 13.06,3.61 13.06,24.17l0 47.94c0,20.57 -2.09,24.18 -13.2,24.18 -10.98,0 -13.07,-3.61 -13.07,-24.18l0 -47.94zm72.95 73.65m53.78 -73.09c0,-21.95 2.36,-22.23 11.25,-22.23 8.34,0 11.54,0.69 11.54,18.34 0,21.54 -3.06,24.18 -11.95,24.18l-10.84 0 0 -20.29zm0 24.32l9.59 0 16.81 44.74c0.83,2.92 1.25,4.03 4.45,4.03l46.96 0c1.25,0 3.06,0 3.06,-1.81 0,-2.22 -1.39,-2.22 -2.78,-2.22 -9.03,0 -22.93,-26.82 -23.34,-38.77 0,-3.47 -0.42,-3.19 -5.42,-2.36 -14.04,4.03 -27.79,0.14 -34.88,-4.59l0 -0.27c19.04,-1.25 50.72,1.25 50.72,-25.85 0,-24.73 -27.1,-23.48 -44.74,-23.48l-70.73 0c-1.11,0 -3.48,0 -3.48,2.08 0,1.67 1.95,1.95 3.34,1.95 8.75,0 9.45,2.5 9.45,36.12l0 19.04c0,33.63 -0.7,36.13 -9.45,36.13 -1.39,0 -3.34,0.28 -3.34,1.95 0,2.08 2.37,2.08 3.48,2.08l59.61 0c1.11,0 3.47,0 3.47,-2.08 0,-1.67 -1.94,-1.95 -3.33,-1.95 -8.76,0 -9.45,-2.5 -9.45,-36.13l0 -8.61z"></path>   <path class="fil0" d="M1780.16 540.93m33.9 -99.35c-17.78,0 -21.39,-3.48 -23.76,-7.09 -1.8,-2.64 -4.16,-3.33 -4.16,2.09l-5.56 42.24c-0.42,4.44 2.78,4.44 3.89,0.69 3.06,-9.45 17.51,-33.9 29.59,-33.9l0 74.48c0,8.89 0,16.81 -10.56,16.81 -1.66,0 -5.55,0 -5.55,2.22 0,1.81 2.91,1.81 4.44,1.81l64.34 0c1.53,0 4.44,0 4.44,-1.81 0,-2.22 -3.89,-2.22 -5.55,-2.22 -10.56,0 -10.56,-7.92 -10.56,-16.81l0 -74.48c14.17,0 23.76,19.03 29.04,30.71 2.36,7.78 5.55,5.69 5.55,3.33l-4.3 -41.27c-0.84,-6.25 -2.36,-5.83 -3.89,-3.19 -3.48,5.69 -8.48,6.39 -14.73,6.39l-52.67 0zm74.21 99.35m89.34 -105.05c-1.25,-6.53 -2.78,-5.84 -4.44,-2.08 -1.12,2.78 -3.62,7.78 -12.23,7.78 -2.64,0 -6.39,-0.56 -10.7,-1.25 -4.31,-0.7 -9.17,-1.25 -14.04,-1.25 -21.39,0 -46.82,8.33 -46.82,34.04 0,39.74 60.86,27.1 60.86,51.69 0,10.42 -8.76,14.59 -18.2,14.59 -22.24,0 -37.52,-27.79 -38.22,-30.15 -0.41,-1.39 -1.8,-4.31 -3.47,-4.31 -1.81,0 -2.08,1.25 -1.39,6.39l4.59 34.32c0.13,1.11 0,4.31 1.8,4.31 3.61,0 2.36,-8.48 15.01,-8.48 4.72,0 9.45,0.42 14.17,0.98 4.73,0.41 9.45,0.97 14.18,0.97 22.37,0 50.57,-10.98 50.57,-37.24 0,-18.34 -10.83,-26.12 -39.88,-35.71 -7.64,-2.5 -20.98,-6.11 -20.98,-16.4 0,-8.33 7.51,-10.97 14.59,-10.97 14.73,0 29.18,14.31 34.05,22.51 3.61,5.97 4.86,1.94 4.86,1.39l-4.31 -31.13z"></path>   <polygon class="fil1" points="576.45,588.08 1638.48,588.08 1638.48,603.64 576.45,603.64 "></polygon>   <polygon class="fil2" points="376.89,579.86 585.44,579.86 585.44,611.86 376.89,611.86 "></polygon>   <path class="fil1" d="M251.35 499.07c-2.65,16.35 -5.3,32.71 -7.95,49.06 53.37,0 106.74,0 160.12,0 25.46,0.59 50.28,-4.51 63.7,-24.53 15.97,-23.84 20.39,-51.5 8.61,-74.03 -10.66,-14.67 -26.93,-17.87 -44.77,-17.9 -33,0 -66.03,1.46 -99,0 -10.88,-0.47 -13.81,-6.13 -11.93,-11.92 3.13,-9.61 13.05,-12.34 26.57,-11.51 48.92,0 97.85,0 146.77,0 3,-16.6 6.01,-33.21 9.01,-49.82 -17.64,0 -35.28,0 -52.92,0 -5.12,7.95 -10.25,15.9 -15.38,23.85 -25.26,6.49 -51.81,10.38 -80.09,10.83 -27.52,-1.28 -55.06,-2.76 -82.02,5.03 -29.65,9.96 -55.34,37.38 -63.75,64.9 -8.41,27.52 -8.22,34.21 -24.78,36.76 -28.79,4.44 -58.78,4.26 -87.21,0 -13.13,-1.97 -11.95,-18.38 -7.28,-42.06 -18.64,0 -37.28,0 -55.93,0 -3.37,30.16 -15.68,85.72 29.36,90.4 43.8,4.56 88.11,1.63 132.11,0 24.79,-0.91 42.77,-14.72 52.95,-38.53 5.9,-22.04 11.79,-44.09 17.69,-66.14 3.98,20.79 17.15,31.64 38.38,33.78 38.25,0 76.49,0 114.73,0 10.02,-1.03 13.7,15.81 -2.23,20.94 -54.44,0 -108.87,0 -163.3,0 -0.49,0.29 -0.97,0.59 -1.46,0.89z"></path>   <path class="fil3" d="M234.72 386.92c-22.37,27.81 -39.01,58.25 -40.97,95.42 17.66,-45.4 36.35,-69.43 58.81,-82.62 23.98,-14.08 49.15,-13.84 81.97,-12.28 32.81,1.55 67.51,-3.55 95.51,-9.31 12.88,-15.06 20.13,-32.52 36.62,-45.16 -33.25,13.54 -57.37,21.63 -88.55,23.39 -70.35,3.99 -108.65,-10.85 -143.39,30.56z"></path>   <path class="fil4" d="M218.14 401.09c10.41,-16.46 24.68,-30.84 43.7,-42.67 -12.75,0 -25.49,0 -38.24,0 -1.82,14.22 -3.64,28.45 -5.46,42.67z"></path>  </g> </g></svg>
//           </div>
//           <div class="receipt-id" style="margin-top: -120px 0 40px 0">
              
//           </div>
//   </section>
//   <section class="address">
  
//         <div>
//             <p class="title">From:</p>
//             <h4 style="font-size: 9px; line-height: 5px">${invoice?.businessDetails?.data?.data?.businessName}</h4>
//             <p style="font-size: 9px; line-height: 5px">${invoice?.businessDetails?.data?.data?.email}</p>
//             <p style="font-size: 9px; line-height: 5px">${invoice?.businessDetails?.data?.data?.phoneNumber}</p>
//             <p style="font-size: 9px; line-height: 5px">${invoice?.businessDetails?.data?.data?.address}</p>
//         </div>
  
//         <div style="margin-bottom: 100px; margin-top: 20px">
//         <p class="title">Bill to:</p>
//           <h4 style="font-size: 9px; line-height: 5px">${client.name}</h4>
//           <p style="font-size: 9px; line-height: 5px">${client?.email}</p>
//           <p style="font-size: 9px; line-height: 5px">${client?.phone}</p>
//           <p style="font-size: 9px; line-height: 5px">${client?.address}</p>
//         </div>
  
//       <div class="status" style="margin-top: -253px">
//           <h1 style="font-size: 12px">${(total - totalAmountReceived) <= 0 ? 'Receipt' : type}</h1>
//           <p style="font-size: 8px; margin-bottom: 10px">${id}</p>
//           <p class="title" style="font-size: 8px">Status</p>
//           <h3 style="font-size: 12px">${status}</h3>
//           <p class="title" style="font-size: 8px">Date</p>
//           <p  style="font-size: 9px" >${moment().format("MMM Do YYYY")}</p>
//           <p class="title"  style="font-size: 8px">Due Date</p>
//           <p  style="font-size: 9px">${selectedDate? moment(selectedDate).format("MMM Do YYYY") : '27th Sep 2021'}</p>
//           <p class="title"  style="font-size: 8px">Amount</p>
//           <h3 style="font-size: 12px">${total}</h3>
//       </div>
//   </section>
  
//   <table>
//     <tr>
//       <th style="font-size: 9px">Item</th>
//       <th style="font-size: 9px">Quantity</th>
//       <th style="font-size: 9px">Price</th>
//       <th style="font-size: 9px">Discount(%)</th>
//       <th style="text-align: right; font-size: 9px">Amount</th>
//     </tr>
  
//     ${invoiceData?.items?.map((itemField) => (
//       `<tr>
//         <td style="font-size: 9px">${itemField.itemName}</td>
//         <td style="font-size: 9px">${itemField.quantity}</td>
//         <td style="font-size: 9px">${itemField.unitPrice}</td>
//         <td style="font-size: 9px">${itemField.discount}</td>
//         <td style="text-align: right; font-size: 9px">${(itemField.quantity * itemField.unitPrice) - (itemField.quantity * itemField.unitPrice) * itemField.discount / 100}</td>
//       </tr>`
//     )).join('')}
    
  
  
//   </table>
  
//   <section class="summary">
//       <table>
//           <tr>
//             <th style="font-size: 9px">Invoice Summary</th>
//             <th></th>
//           </tr>
//           <tr>
//             <td style="font-size: 9px">Sub Total</td>
//             <td style="text-align: right; font-size: 9px; font-weight: 700">${subTotal}</td>
//           </tr>
  
//           <tr>
//               <td style="font-size: 10px">VAT</td>
//               <td style="text-align: right; font-size: 9px; font-weight: 700">${vat}</td>
//             </tr>
  
//           <tr>
//               <td style="font-size: 10px">Total</td>
//               <td style="text-align: right; font-size: 9px; font-weight: 700">${currency} ${toCommas(total)}</td>
//             </tr>
  
//           <tr>
//               <td style="font-size: 10px" >Paid</td>
//               <td style="text-align: right; font-size: 9px; font-weight: 700">${currency} ${toCommas(totalAmountReceived)}</td>
//             </tr>
  
//             <tr>
//             <td style="font-size: 9px">Balance Due</td>
//             <td style="text-align: right; font-size: 9px; font-weight: 700">${currency} ${toCommas(total - totalAmountReceived)}</td>
//           </tr>
          
//         </table>
//     </section>
//     <div>
//         <hr>
//         <h4 style="font-size: 9px">Note</h4>
//         <p style="font-size: 9px">${invoiceData.notes}</p>
//     </div>
//   </div>
//   </body>
//   </html>`

//   // Add the test div content to the PDF
//   pdf.html(testDiv, {
//     callback: (pdf) => {
//       // Save or open the PDF in a new tab
//       pdf.save('invoice.pdf');

//       // Remove the test div from the DOM
//       document.body.removeChild(testDiv);
//     },
//   });
// };


const printDiv = () => {
  document.title = client.name + " - " + moment(selectedDate).format("DD-MM-YYYY"); // Change this to your desired title
  window.print();
};




if(!invoice) {
  return (
    <Spinner />
  )
}


    return (
        <div className={styles.PageLayout}>
           {invoice?.creator?.includes(user?.result?._id || user?.result?.googleId) && (
            <div className={styles.buttons} id='top-buttons'>
                  {/* <ProgressButton 
                    onClick={sendPdf} 
                    state={sendStatus}
                    onSuccess={()=> openSnackbar("Invoice sent successfully")}
                  >
                  Send to Customer
                  </ProgressButton> */}
              
                {/* <ProgressButton style={{width: '200px'}}
                  onClick={createAndDownloadPdf} 
                  state={downloadStatus}>
                  Download PDF
                </ProgressButton> */}
                <button onClick={printDiv} className={styles.btn} >Download PDF</button>

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
            <div className={styles.invoiceLayout} id="contentToPrint">
        <Container>
        
            <Grid container justifyContent="space-between" style={{padding: '30px 0px' }} id='logo'>
            {!invoice?.creator?.includes(user?.result._id || user?.result?.googleId) ? 
            (
              <Grid item>
              </Grid>
            )
            : (
              <>
                {/*{company?.logo ? <img src={'https://i.postimg.cc/RFzbLWZ1/juggle-sports-logo.png'} style={{width:'100%'}} alt="Logo" className={styles.logo} /> 
              :
            <h2>{company?.name}</h2> 
              }*/}
             <Logo width={'100%'} />

               {/* <Grid item onClick={() => history.push('/settings')} style={{cursor: 'pointer'}}>
                    {company?.logo ? <img src={'https://i.ibb.co/rQMLWds/juggle-sports-logo.png'} style={{width:'100%'}} alt="Logo" className={styles.logo} /> 
                    :
                    <h2>{company?.name}</h2>
                    }
                </Grid> */}
                </>
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
                        <Typography variant="subtitle2" style={{fontWeight: 'bold', fontSize:'15px'}}>Juggle Sports</Typography>
                        <Typography variant="body2">jugglesports@gmail.com</Typography>
                        <Typography variant="body2">alnoorind@gmail.com</Typography>
                        <Typography variant="body2">0092-347-4931430</Typography>
                        <Typography variant="body2">0092-300-6197746</Typography>
                        <Typography variant="body2" gutterBottom>Defence Road Near Nadra Office Sialkot (51310) PAKISTAN.</Typography>
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

    <TableContainer component={Paper} id='item-table'>
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
                
                <div className={styles.invoiceSummary} id='summary'>
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

                <div className={styles.note} id='notes'>
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
