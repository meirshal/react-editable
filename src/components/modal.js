import React from 'react';
import { createPortal } from 'react-dom';
import { Dialog } from 'primereact/dialog';

const id = 'modalPlaceholder';

export const ModalPlaceholder = () => (
  <div id={id} className="popup-editor fe" />
);

export default (props) => {
  const { closable = false, visible = true } = props;

  return createPortal(
    <Dialog
      position="center"
      closable={closable}
      visible={visible}
      className={props.className}
    >
      {props.children}
    </Dialog>,
    document.getElementById(id)
  );
};
