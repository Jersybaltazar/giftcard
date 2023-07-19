import React, { useState, useEffect, useRef } from 'react';
import { 
  Avatar, 
  Button, 
  Checkbox, 
  FormControl, 
  FormControlLabel, 
  FormHelperText, 
  Grid, 
  IconButton, 
  MenuItem, 
  Modal, 
  Select, 
  Tooltip
} from '@mui/material';
import 'animate.css';
import { Formik } from 'formik';
import { 
  Box, 
  TextField, 
  Typography 
} from '@mui/material';
import * as Yup from 'yup';
import _ from 'lodash';
import { 
  UserService, 
  CategorieService, 
  PartnerService,
  GiftCardService
} from '../../../services';
import { useUI } from '../../../app/context/ui';
import { ModalCustomStyles } from '../../../assets/css';
import { CustomerStyles } from './customer-style';
import RefreshIcon from '@mui/icons-material/Refresh';

let dlgSettings = {
  confirm: true,
  btn: {
    close: 'CANCELAR',
    confirm: 'SI',
  },
  onConfirm: () => {},
};

const userService = new UserService();
const categorieService = new CategorieService();
const partnerService = new PartnerService();
const giftCardService = new GiftCardService();

const CustomerManager = (props) => {

  const { open, setOpen, setRows, rows, dataEmployee } = props;
  const { blockUI, dialogUI } = useUI();
  const [ openNewGiftCard, setOpenNewGiftCard ] = useState(false);
  const [ customerCreated, setCustomerCreated] = useState({});
  const modalStyle = ModalCustomStyles();
  const customerStyle = CustomerStyles();
  const [checked, setChecked] = useState([]);
  const [codeScaned, setCodeScaned] = useState('');
  const formikRef = useRef();

  const baseValues = {
    categorie: '',
    dni: '',
    name: '',
    birthdate: '',
    phone: ''
  };

  const initialValuesGiftcard = {
    giftphone: '',
    amount: '',
    code: '',
    permissions: [],
    type: '',
  };

  const [initialValues, setInitialValues] = useState(baseValues);
  const [hasError, setHasError] = useState({});
  const [requestFailed, setRequestFailed] = useState(false);
  const [requestFailedGiftcard, setRequestFailedGiftcard] = useState(false);
  const [hasErrorGiftcard, setHasErrorGiftcard] = useState({});
  const [categoriesAvailable, setCategoriesAvailable] = useState([]);
  const [partnersAvailable, setPartnersAvailable] = useState([]);

  const validationSchema = Yup.object({
    categorie: Yup
      .string()
      .required('Obligatorio'),
    dni: Yup
      .string()
      .matches(/^[0-9]+$/, 'Debe contener solo números')
      .min(8,'8 dígitos')
      .max(8,'8 dígitos')
      .required('Obligatorio'),
    name: Yup
      .string()
      .required('Obligatorio'),
    phone: Yup
      .string()
      .required('Obligatorio')
  });

  const validationSchemaGiftcard = Yup.object({
    amount: Yup
      .number()
      .required('Obligatorio'),
    code: Yup
      .string()
      .required('Obligatorio'),
    type: Yup
      .string()
      .required('Obligatorio'),
  });

  const handleChangePartner = (event) => {
    const value = event.target.value;
    const status = event.target.checked;
    let newChecked = checked.map((e)=>{
      if(e.id === value){
        return { ...e, status};
      }else{
        return e;
      }
    });
    setChecked(newChecked);
  };

  const onSubmit = async (values) => {
    try {
      blockUI.current.open(true);
      setRequestFailed(false);
      userService.getAccessToken();

      let resultUser;

      if(dataEmployee.id){
        resultUser = await userService.update({
            ...values,
          }, dataEmployee.id);
      }else{
        resultUser = await userService.create(
          {
            ...values, 
            status: 1,
            role: 'USER_ROLE'
          });

          dlgSettings = {
            ...dlgSettings,
            confirm: true,
            onConfirm: () => {
              onBuyGiftcard(resultUser.data.user);
            },
          };
          dialogUI.current.open(
            `Cliente ${resultUser.data.user.name} registrado`,
            'Desea agregar una gift card?',
            dlgSettings
          );
      }
      const r1 = await userService.listCustomers("status=1,2");
      setRows(r1.data.users);

      blockUI.current.open(false);

      if(dataEmployee.id){
        setOpen(false);
      }
    } catch (e) {
      blockUI.current.open(false);
      setRequestFailed(true);
      if (!_.isUndefined(e.response.data)) {
        let type = e.response.data.type;
        switch (type) {
          case "DNI repeated": setHasError({ message: 'El DNI ya está registrado' }); break;
          case "in_trash_can": setHasError({ message: 'El usuario está en papelera' }); break;
          default: setHasError({ message: e.response.data.msg }); break;
        }
      }
    }
  };

  const onSubmitGiftcard = async (values) => {
    try {
      blockUI.current.open(true);
      setRequestFailedGiftcard(false);
      giftCardService.getAccessToken();
      let permissions = [];
      checked.map((e)=>{
        if(e.status){
          permissions.push(e.id);
        }
      });

      if(values.code === ''){
        delete values.code;
      }

      await giftCardService.create({
        ...values,
        user: customerCreated.uid,
        permissions
      });
      blockUI.current.open(false);
      setOpenNewGiftCard(false);
      setOpen(false);
    } catch (e) {
      blockUI.current.open(false);
      setRequestFailedGiftcard(true);
      if (!_.isUndefined(e.response.data)) {
        setHasErrorGiftcard({ message: e.response.data.message });
      }
    }
  }

  const onBuyGiftcard = (customer) => {
    try {
      setCustomerCreated(customer);
      setOpenNewGiftCard(true);
      dlgSettings = {
        ...dlgSettings,
        confirm: false,
        btn: {
          close: 'CERRAR',
        },
      };
      dialogUI.current.open('', '', dlgSettings, 'Cliente registrado');
    } catch (e) {
      blockUI.current.open(false);
    }
  };

  const getListCategorie = async () => {
    try {
      blockUI.current.open(true);
      categorieService.getAccessToken();
      const r1 = await categorieService.listSearch('status=1,2');
      setCategoriesAvailable(r1.data.categories);
      blockUI.current.open(false);
    } catch (e) {
      blockUI.current.open(false);
    }
  };

  const getListPartner = async () => {
    try {
      blockUI.current.open(true);
      partnerService.getAccessToken();
      const r1 = await partnerService.listSearch('status=1,2');
      setPartnersAvailable(r1.data.partners);
      const checkedPartners = r1.data.partners.map((e)=>({id: e.uid, status: true}));
      setChecked(checkedPartners);
      blockUI.current.open(false);
    } catch (e) {
      blockUI.current.open(false);
    }
  };

  useEffect(() => {
    if(dataEmployee.id){
      const birthdate = new Date(dataEmployee.birthdate).toISOString().split("T")[0];
      setInitialValues({...dataEmployee, categorie: dataEmployee.categorie?._id, birthdate});
    }
  }, [dataEmployee]);

  const setFieldValueFromExternalFunction = (codeScaned) => {
    if (formikRef && formikRef.current && formikRef.current.setFieldValue) {
      formikRef.current.setFieldValue("code", codeScaned);
    }
  };

  const handleClearCode = () => {
    setCodeScaned('');
    formikRef.current.setFieldValue("code", '');
  }

  useEffect(() => {
    if(codeScaned.length===10){
      setFieldValueFromExternalFunction(codeScaned);
    }
  }, [codeScaned]);

  useEffect(() => {
    setCodeScaned('');
  }, []);

  useEffect(() => {
    setRequestFailed(false);
    setHasError({message: ''});
  }, []);

  useEffect(() => {
    (async function init() {
      await getListCategorie();
      await getListPartner();
    })();
  }, []);

  return (
    <>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        aria-labelledby="simple-modal-title"
        aria-describedby="simple-modal-description"
        disableEscapeKeyDown={true}
        className="animate__animated animate__backInLeft"
      >
        <div className={modalStyle.paperModal}>
          <Typography className="title">{(!dataEmployee.id) ? 'CREAR CUENTA DE CLIENTE' : 'EDITAR CUENTA DE CLIENTE'}</Typography>
          <Typography component="div">
            {requestFailed && (
              <p className={modalStyle.formError} align="center">{hasError.message}</p>
            )}
          </Typography>
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={onSubmit}
            enableReinitialize={true}
          >
            {(props) => {
              const {
                values,
                touched,
                errors,
                handleChange,
                handleBlur,
                handleSubmit,
              } = props;
              return(
                <div>
                  <Grid container spacing={3} className='wrapperForm'>
                    <Grid item xs={4} className={modalStyle.grdItem}>
                      <label>CATEGORÍA</label>
                    </Grid>
                    <Grid item xs={8}>
                      <FormControl variant="outlined" fullWidth className={modalStyle.inputCustom}>
                        <Select
                          displayEmpty
                          id="categorie"
                          name="categorie"
                          value={values.categorie}
                          onChange={handleChange}
                          size='small'
                          error={touched.categorie && Boolean(errors.categorie)}
                          helpertext={
                            errors.categorie && touched.categorie ? errors.categorie : ""
                          }
                        >
                          <MenuItem value="">Selecciona una opción</MenuItem>
                          {
                            categoriesAvailable.map((e, index)=>(
                              <MenuItem key={`categorie${index}`} value={e._id}>{e.name}</MenuItem>
                            ))
                          }
                        </Select>
                        <FormHelperText className={modalStyle.formError}>{errors.categorie}</FormHelperText>
                      </FormControl>
                    </Grid>
                    <Grid item xs={4} className={modalStyle.grdItem}>
                      <label>DNI</label>
                    </Grid>
                    <Grid item xs={8}>
                      <TextField
                        type="text"
                        id="dni"
                        name="dni"
                        autoComplete="dni"
                        value={values.dni || ''}
                        className={modalStyle.texfield}
                        placeholder="Escriba aqui ..."
                        size='small'
                        margin="normal"
                        required
                        fullWidth
                        variant="outlined"
                        helperText={
                          errors.dni && touched.dni ? errors.dni : ""
                        }
                        error={!!(errors.dni && touched.dni)}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                    </Grid>
                    <Grid item xs={4} className={modalStyle.grdItem}>
                      <label>NOMBRE(S)</label>
                    </Grid>
                    <Grid item xs={8}>
                      <TextField
                        type="text"
                        id="name"
                        name="name"
                        autoComplete="name"
                        value={values.name || ''}
                        className={modalStyle.texfield}
                        placeholder="Escriba aqui ..."
                        size='small'
                        margin="normal"
                        required
                        fullWidth
                        variant="outlined"
                        helperText={
                          errors.name && touched.name ? errors.name : ""
                        }
                        error={!!(errors.name && touched.name)}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                    </Grid>
                    <Grid item xs={4} className={modalStyle.grdItem}>
                      <label>F.NAC</label>
                    </Grid>
                    <Grid item xs={8}>
                      <TextField
                        type="date"
                        id="birthdate"
                        name="birthdate"
                        autoComplete="birthdate"
                        value={values.birthdate || ''}
                        className={modalStyle.texfield}
                        placeholder="Escriba aqui ..."
                        size='small'
                        margin="normal"
                        required
                        fullWidth
                        variant="outlined"
                        helperText={
                          errors.birthdate && touched.birthdate ? errors.birthdate : ""
                        }
                        error={!!(errors.birthdate && touched.birthdate)}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                    </Grid>
                    <Grid item xs={4} className={modalStyle.grdItem}>
                      <label>CELULAR</label>
                    </Grid>
                    <Grid item xs={8}>
                      <TextField
                        type="text"
                        id="phone"
                        name="phone"
                        autoComplete="phone"
                        value={values.phone || ''}
                        className={modalStyle.texfield}
                        placeholder="Escriba aqui ..."
                        size='small'
                        margin="normal"
                        required
                        fullWidth
                        variant="outlined"
                        helperText={
                          errors.phone && touched.phone ? errors.phone : ""
                        }
                        error={!!(errors.phone && touched.phone)}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                    </Grid>
                  </Grid>
                  <Box pb={5}/>
                  <Grid container justifyContent="center">
                    <Button
                      variant="contained"
                      size="large"
                      className={modalStyle.button}
                      onClick={() => { setOpen(false) }}
                      style={{
                        marginRight: '24px',
                        backgroundColor: '#808080ba'
                      }}
                    >
                      CANCELAR
                    </Button>
                    <Button
                      variant="contained"
                      size="large"
                      color="primary"
                      onClick={()=>{handleSubmit()}}
                    >
                      GUARDAR
                    </Button>
                  </Grid>
                </div>
              );
            }}
          </Formik>
        </div>
      </Modal>

      {
        (openNewGiftCard)
          &&
            <Modal
              open={openNewGiftCard}
              onClose={() => setOpenNewGiftCard(false)}
              aria-labelledby="simple-modal-title"
              aria-describedby="simple-modal-description"
              disableEscapeKeyDown={true}
              className="animate__animated animate__backInLeft"
            >
              <div className={modalStyle.paperModal}>
                <Typography className="title">NUEVA GIFT CARD</Typography>
                <Typography component="div">
                  {requestFailedGiftcard && (
                    <p className={modalStyle.formError} align="center">{hasErrorGiftcard.message}</p>
                  )}
                </Typography>
                <Formik
                  initialValues={initialValuesGiftcard}
                  validationSchema={validationSchemaGiftcard}
                  onSubmit={onSubmitGiftcard}
                  enableReinitialize={true}
                  innerRef={formikRef}
                >
                  {(props) => {
                    const {
                      values,
                      touched,
                      errors,
                      handleChange,
                      handleBlur,
                      handleSubmit,
                    } = props;
                    return(
                      <div>
                        <Grid container spacing={3} className='wrapperForm'>
                          <Grid item xs={12} style={{textAlign: 'center'}}>
                            <Tooltip title="LIMPIAR CAMPO" placement="top">
                              <IconButton
                                color="primary" 
                                component="label"
                                onClick={handleClearCode}
                                size="large"
                              >
                                <RefreshIcon/>
                              </IconButton>
                            </Tooltip>
                          </Grid>
                          <Grid item xs={4} className={modalStyle.grdItem}>
                            <label>MONTO</label>
                          </Grid>
                          <Grid item xs={8}>
                            <TextField
                              type="number"
                              id="amount"
                              name="amount"
                              autoComplete="amount"
                              value={values.amount || ''}
                              className={modalStyle.texfield}
                              placeholder="Escriba aqui ..."
                              size='small'
                              margin="normal"
                              required
                              fullWidth
                              variant="outlined"
                              helperText={
                                errors.amount && touched.amount ? errors.amount : ""
                              }
                              error={!!(errors.amount && touched.amount)}
                              onChange={handleChange}
                              onBlur={handleBlur}
                            />
                          </Grid>
                          <Grid item xs={4} className={modalStyle.grdItem}>
                            <label>CÓDIGO</label>
                          </Grid>
                          <Grid item xs={8}>
                            <TextField
                              type="text"
                              id="code"
                              name="code"
                              autoFocus={(openNewGiftCard) ? true : false}
                              autoComplete="code"
                              value={values.code || ''}
                              className={modalStyle.texfield}
                              placeholder="Escriba aqui ..."
                              size='small'
                              margin="normal"
                              required
                              fullWidth
                              variant="outlined"
                              helperText={
                                errors.code && touched.code ? errors.code : ""
                              }
                              error={!!(errors.code && touched.code)}
                              onInput={(event)=>{
                                if(event.target.value/10 < 1){
                                  setCodeScaned(`${codeScaned}${event.target.value}`);
                                }
                              }}
                              onBlur={handleBlur}
                            />
                          </Grid>
                          <Grid item xs={4} className={modalStyle.grdItem}>
                            <label>CELULAR</label>
                            <div className='optional'>(Nuevo receptor)</div>
                          </Grid>
                          <Grid item xs={8}>
                            <TextField
                              type="number"
                              id="giftphone"
                              name="giftphone"
                              autoComplete="giftphone"
                              value={values.giftphone || ''}
                              className={modalStyle.texfield}
                              placeholder="Escriba aqui ..."
                              size='small'
                              margin="normal"
                              required
                              fullWidth
                              variant="outlined"
                              helperText={
                                errors.giftphone && touched.giftphone ? errors.giftphone : ""
                              }
                              error={!!(errors.giftphone && touched.giftphone)}
                              onChange={handleChange}
                              onBlur={handleBlur}
                            />
                          </Grid>
                          <Grid item xs={4} className={modalStyle.grdItem}>
                            <label>M. PAGO</label>
                          </Grid>
                          <Grid item xs={8}>
                            <Select
                              labelId="type"
                              id="type"
                              name="type"
                              value={values.type}
                              label="Tipo"
                              onChange={handleChange}
                              fullWidth
                              helpertext={
                                errors.type && touched.type ? errors.type : ""
                              }
                              error={!!(errors.type && touched.type)}
                              style={{height: '44px', textAlign: 'center'}}
                            >
                              <MenuItem value={'EFECTIVO'}>EFECTIVO</MenuItem>
                              <MenuItem value={'TARJETA'} >TARJETA</MenuItem>
                            </Select>
                          </Grid>
                          <Grid item xs={12} className={customerStyle.titlePartner} style={{textAlign:'center'}}>
                            PARTNERS
                          </Grid>

                          <Grid item xs={12} className={customerStyle.wrapperPartner}>
                          {
                            partnersAvailable.map((partner, index)=>(
                              <Grid key={`partner${index}`} container>
                                <Grid item xs={5}>
                                  <Avatar
                                    alt={partner.name}
                                    src={partner.logo}
                                    sx={{ width: 56, height: 56 }}
                                  />
                                </Grid>
                                <Grid item xs={7}>
                                  <FormControlLabel
                                    className={customerStyle.wrapperCheckbox}
                                    control={
                                      <Checkbox
                                        checked={checked.filter((e)=>e.id === partner.uid)[0].status}
                                        onChange={handleChangePartner}
                                        value={partner.uid}
                                      />
                                    }
                                    label={partner.name}
                                  />
                                </Grid>
                              </Grid>
                            ))
                          }
                          </Grid>

                        </Grid>
                        <Box pb={5}/>
                        <Grid container justifyContent="center">
                          <Button
                            variant="contained"
                            size="large"
                            className={modalStyle.button}
                            onClick={() => { setOpenNewGiftCard(false) }}
                            style={{
                              marginRight: '24px',
                              backgroundColor: '#808080ba'
                            }}
                          >
                            CANCELAR
                          </Button>
                          <Button
                            variant="contained"
                            size="large"
                            color="primary"
                            onClick={()=>{handleSubmit()}}
                          >
                            GUARDAR
                          </Button>
                        </Grid>
                      </div>
                    );
                  }}
                </Formik>
              </div>
            </Modal>
      }
      
    </>
  )
}

export default CustomerManager;
