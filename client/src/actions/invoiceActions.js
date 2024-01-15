import * as api from '../api/index'

import { ADD_NEW, UPDATE, DELETE, GET_INVOICE, FETCH_INVOICE_BY_USER, START_LOADING, END_LOADING } from './constants'

// export const getInvoices = () => async (dispatch)=> {
//     try {
//         const { data } = await api.fetchInvoices()
//         dispatch({ type: FETCH_ALL, payload: data })
//     } catch (error) {
//         console.log(error)
//     }
// }

export const getInvoicesByUser = (searchQuery) => async (dispatch) => {
    try {
      dispatch({ type: START_LOADING });
  
      const { data: { data } } = await api.fetchInvoicesByUser(searchQuery);
  
      // Add date parsing with error handling
      const invoicesWithParsedDates = data.map((invoice) => {
        try {
          // Assuming 'date' is the property representing the date in your data
          const parsedDate = new Date(invoice.date);
          // Replace 'date' with your actual date property
          return { ...invoice, date: parsedDate };
        } catch (error) {
          console.error('Error parsing date:', invoice.date, error);
          // Handle the error as needed; you can skip this invoice or set a default date
          return { ...invoice, date: null }; // Set a default value or null for invalid dates
        }
      });
  
      dispatch({ type: FETCH_INVOICE_BY_USER, payload: invoicesWithParsedDates });
      dispatch({ type: END_LOADING });
    } catch (error) {
      console.log(error.response);
    }
  };


export const getInvoice = (id) => async (dispatch)=> {

    const user = JSON.parse(localStorage.getItem('profile'))

    try {
        const { data } = await api.fetchInvoice(id)
        const businessDetails = await api.fetchProfilesByUser({search: user?.result?._id || user?.result?.googleId})
        const invoiceData = {...data, businessDetails}
        // console.log(invoiceData)
        dispatch({ type: GET_INVOICE, payload: invoiceData  })
    } catch (error) {
        console.log(error.response)
    }
}

export const createInvoice =(invoice, history) => async (dispatch) => {
    try {
        dispatch({ type: START_LOADING })
        const { data } = await api.addInvoice(invoice)
        dispatch({ type: ADD_NEW, payload: data })
        history.push(`/invoice/${data._id}`)
        dispatch({ type: END_LOADING })
    } catch (error) {
        console.log(error)
    }
}

export const updateInvoice =(id, invoice) => async (dispatch) => {

    try {
        const { data } = await api.updateInvoice(id, invoice)
        dispatch({ type: UPDATE, payload: data })
        
    } catch (error) {
        console.log(error)
    }
}

export const deleteInvoice =(id, openSnackbar) => async (dispatch) => {
    try {
        await api.deleteInvoice(id)

        dispatch({type: DELETE, payload: id})
        openSnackbar("Invoice deleted successfully")
    } catch (error) {
        console.log(error.response)
    }
}