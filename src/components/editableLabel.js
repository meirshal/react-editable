import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import NumberFormat from 'react-number-format';

import Editable from './editable';

export const EditLabel = ({
  value,
  onChange,
  useTextArea,
  isNumeric,
  min,
  max,
  className,
}) => (
  <>
    {useTextArea ? (
      <InputTextarea
        value={value}
        itemTemplate={(e) => {
          return e.label;
        }}
        onInput={(e) => onChange(_.get(e, 'target.value'))}
        className={className}
        autoFocus
      />
    ) : isNumeric ? (
      <InputNumber
        value={value}
        mode="decimal"
        format={false}
        min={min}
        max={max}
        onChange={(e) => onChange(_.get(e, 'value'))}
        className={className}
        autoFocus
      />
    ) : (
      <InputText
        value={value}
        onInput={(e) => onChange(_.get(e, 'target.value'))}
        className={className}
        autoFocus
      />
    )}
  </>
);

const Currency = ({ value }) => {
  return (
    <div>
      {' '}
      <NumberFormat
        value={value}
        displayType={'text'}
        thousandSeparator={true}
        prefix={'$'}
        suffix=""
      />
      <span className="rev-suffix" />
    </div>
  );
};

const EditableLabel = ({ isCurrency, title, ...other }) => (
  <Editable
    title={title}
    ViewComponent={({ value }) => {
      if (isCurrency === true) {
        return <Currency value={value} />;
      } else {
        return <div title={title}> {value} </div>;
      }
    }}
    EditComponent={EditLabel}
    {...other}
  />
);

EditableLabel.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  useTextArea: PropTypes.bool,
};

EditableLabel.defaultProps = {
  useTextArea: false,
};

export default EditableLabel;
