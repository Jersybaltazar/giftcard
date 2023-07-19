import React from 'react';
import branchmain from "../../assets/images/branchmain.png";
import { GiftCardCustomerPublicStyles } from './styles/giftcard-public-style';

const Home = () => {

  const style = GiftCardCustomerPublicStyles();

  return (
    <div className={style.wrapperImg}>
      <img src={branchmain} alt="imgGiftcard" className='imgPending'/>
      <h5>SISTEMA DE CLIENTES SOLO PERMITIDO DESDE CELULARES</h5>
    </div>
  )
}

export default Home;
