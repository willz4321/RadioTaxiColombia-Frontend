// ModalComponent.js
import React from 'react';
import { Modal } from 'react-bootstrap';

const modalBodyStyle = {
  padding: '1rem', // Esto agregará un pequeño margen alrededor del contenido
  display: 'flex', // Para centrar el contenido
  justifyContent: 'center', // Centra horizontalmente
  alignItems: 'center', // Centra verticalmente
  overflowY: 'auto', // Permite desplazamiento si el contenido es muy grande
  maxHeight: '90vh', // 90% del alto de la ventana gráfica para asegurar margen en la parte superior e inferior
};

const ModalComponent = ({ show, handleClose, children }) => {
  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Body style={modalBodyStyle}>
        {children}
      </Modal.Body>
    </Modal>
  );
};

export default ModalComponent;
