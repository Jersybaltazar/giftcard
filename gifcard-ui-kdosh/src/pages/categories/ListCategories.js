import React, { useState, useEffect } from 'react';
import { useUI } from '../../app/context/ui';
import { ListStyles } from '../../assets/css';
import { CategorieService } from '../../services';
import { CategorieStyles } from './components/categorie-style';
import { Button, IconButton, Tooltip, Typography, Switch } from '@mui/material';
import dateFormat from "dateformat";
import EditIcon from '@mui/icons-material/Edit';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { DataGrid } from '@mui/x-data-grid';
import clsx from 'clsx';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ModalManager from './components/ModalManager';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import Recycle from './components/Recycle';

let dlgSettings = {
  confirm: true,
  btn: {
    close: 'Cancel',
    confirm: 'Delete',
  },
  onConfirm: () => {},
};

const categorieService = new CategorieService();

const ListCategories = () => {

  const listStyle = ListStyles();
  const classes = CategorieStyles();
  const { blockUI, dialogUI } = useUI();
  const [rows, setRows] = useState([]);
  const [openModalCategorie, setOpenModalCategorie] = useState(false);
  const [dataCategorie, setDataCategorie] = useState({});
  const [ openModalRecycle, setOpenModalRecycle ] = useState(false);

  const columns = [
    { 
      field: 'name', 
      headerName: 'NOMBRE', 
      flex: 0.4,
      minWidth: 200,
    },
    {
      field: '_id',
      headerName: 'ACCIONES',
      minWidth: 100,
      renderCell: (params) => {
        return (
          <div>
            <Tooltip title="Editar" placement="top">
              <IconButton aria-label="edit" color="success" onClick={()=>{handleEdit(params)}}>
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Eliminar" placement="top">
              <IconButton aria-label="delete" color="primary" onClick={()=>{handleDelete(params)}}>
                <DeleteForeverIcon />
              </IconButton>
            </Tooltip>
          </div>
        )
      }
    },
  ];

  const handleEdit = (data) => {
    setDataCategorie(data.row);
    setOpenModalCategorie(true);
  }

  const handleDelete = (data) => {
    dlgSettings = {
      ...dlgSettings,
      confirm: true,
      onConfirm: () => {
        onDeleteTable(data.row);
      },
    };
    dialogUI.current.open(
      'Espera!',
      'Estás seguro de eliminar esta categoría?',
      dlgSettings
    );
  }

  const getListCategorie = async () => {
    try {
      blockUI.current.open(true);
      categorieService.getAccessToken();
      const r1 = await categorieService.listSearch('status=1,2');
      const newData = r1.data.categories.map((e)=>({...e, id: e._id}));
      setRows(newData);
      blockUI.current.open(false);
    } catch (e) {
      blockUI.current.open(false);
    }
  };

  const onDeleteTable = async(data) => {
    try {
      blockUI.current.open(true);
      categorieService.getAccessToken();
      await categorieService.update({
        ...data,
        status: 3
      },data.id);
      let newRows = rows.filter((e)=>(e.id !== data.id));
      setRows(newRows);
      blockUI.current.open(false);
      dlgSettings = {
        ...dlgSettings,
        confirm: false,
        btn: {
          close: 'Close',
        },
      };
      dialogUI.current.open('', '', dlgSettings, 'Eliminado correctamente');
    } catch (e) {
      blockUI.current.open(false);
    }
  };

  const handleCreate = () => {
    setDataCategorie({});
    setOpenModalCategorie(true);
  };

  useEffect(() => {
    (async function init() {
      await getListCategorie();
    })();
  }, []);

  return (
    <div style={{ height: 540, width: '100%', marginTop: '50px' }}>
      <Typography className={classes.title}>CATEGORÍAS</Typography>
      <Button
        onClick={handleCreate} 
        variant="outlined" 
        startIcon={<AddCircleOutlineIcon />}
        style={{marginBottom: '16px'}}
      >
        CREAR
      </Button>

      <Button
        onClick={()=>{setOpenModalRecycle(true)}} 
        variant="outlined" 
        startIcon={<RestoreFromTrashIcon />}
        style={{marginBottom: '16px', marginLeft: '16px', color: 'red', border: 'solid 1px red'}}
      >
        PAPELERA
      </Button>

      <DataGrid
        className={clsx(listStyle.dataGrid, classes.root)} 
        rows={rows} 
        columns={columns}
        pageSize={20}
        pageSizeOptions={[20,50,100]}
      />

      {
        (openModalCategorie)
          &&
            <ModalManager
              open={openModalCategorie}
              setOpen={setOpenModalCategorie}
              setRows={setRows}
              rows={rows}
              dataCategorie={dataCategorie}
            />
      }

      {
        (openModalRecycle)
          &&
            <Recycle
              openR={openModalRecycle}
              setOpenR={setOpenModalRecycle}
            />
      }
      
    </div>
  )
}

export default ListCategories;
