import React from 'react';
import PropTypes from 'prop-types';
import { withState, withHandlers, compose } from 'recompose';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import { Button } from 'primereact/button';
import _ from 'lodash';
import classNames from 'classnames';

import Modal from './modal';
import { isPromise } from '../utils';
import { loadingUntil } from './loadingUntil';

const EditComponentWithControls = ({
  value,
  EditComponent,
  editClassName,
  onChange,
  onCancel,
  onSandboxChange,
  sandboxValue,
  isDirty,
  editInDialog,
  validationError,
  showValidationError,
  applyButtonClassName,
  cancelButtonClassName,
  editClassNameOnError,
  onBlur,
  ...other
}) => {
  return (
    <div onBlur={onBlur} tabIndex={0}>
      <OverlayTrigger
        overlay={
          <Popover placement={'top'}>
            <Popover.Title>Validation error</Popover.Title>
            <Popover.Content>
              {_.get(validationError, 'message')}
            </Popover.Content>
          </Popover>
        }
        placement="top"
        show={isDirty && validationError && showValidationError}
      >
        <EditComponent
          value={isDirty ? sandboxValue : value}
          onChange={onSandboxChange}
          className={classNames(editClassName, {
            [editClassNameOnError]: showValidationError && validationError,
          })}
          {...other}
        />
      </OverlayTrigger>

      {editInDialog === false ? (
        <div className="save-btns">
          <i onClick={onChange} className={applyButtonClassName} />
          <i onClick={onCancel} className={cancelButtonClassName} />
        </div>
      ) : (
        <div className="dialog-save-btns">
          <Button label="Save" onClick={onChange} />
          <Button label="Cancel" onClick={onCancel} />
        </div>
      )}
    </div>
  );
};

EditComponentWithControls.propTypes = {
  applyButtonClassName: PropTypes.string,
  cancelButtonClassName: PropTypes.string,
  editClassNameOnError: PropTypes.string,
};

EditComponentWithControls.defaultProps = {
  applyButtonClassName: 'pi pi-check',
  cancelButtonClassName: 'pi pi-times',
  editClassNameOnError: 'input-validation-error',
};

/**
 * This component renders itself directly under it's parent or under another component, using the createPortal function.
 * **/
export const IsomorphicEditComponent = (props) => {
  const { editInDialog } = props;

  return (
    <>
      {editInDialog ? (
        <Modal className={props.className}>
          <EditComponentWithControls {...props} />
        </Modal>
      ) : (
        <EditComponentWithControls {...props} />
      )}
    </>
  );
};

export const editingHoC = compose(
  withState('isDirty', 'setIsDirty', false),
  withState('sandboxValue', 'setSandboxValue'),
  withState('isLoading', 'setIsLoading', false),
  withState('validationError', 'setValidationError', null),
  withState('showValidationError', 'setShowValidationError', false),
  withHandlers({
    exitEditMode: ({ setEditingMode, setIsDirty, setSandboxValue }) => () => {
      setEditingMode(false);
      setIsDirty(false);
      setSandboxValue(null);
    },
  }),
  withHandlers({
    onSandboxChange: ({
      setSandboxValue,
      setIsDirty,
      validationSchema,
      setValidationError,
    }) => (value) => {
      setIsDirty(true);
      setSandboxValue(value);
      if (validationSchema) {
        const { error: validationError } = validationSchema.validate(value);
        setValidationError(validationError);
      }
    },
    onChange: ({
      onChange,
      sandboxValue,
      setEditingMode,
      onChangeSuccess,
      onChangeError,
      setIsLoading,
      isDirty,
      setIsDirty,
      exitEditMode,
      validationError,
      setShowValidationError,
    }) => () => {
      if (isDirty) {
        if (validationError) {
          setShowValidationError(true);
          return;
        }
        const onChangeResult = onChange(sandboxValue);
        if (isPromise(onChangeResult)) {
          setIsLoading(true);
          onChangeResult
            .then(exitEditMode)
            .then(onChangeSuccess)
            .catch(onChangeError)
            .finally(() => setIsLoading(false));
        } else {
          exitEditMode();
        }
      } else {
        setIsDirty(false);
        setEditingMode(false);
      }
    },
    onCancel: ({ exitEditMode }) => exitEditMode,
    onBlur: ({ exitEditMode }) => (e) => {
      const currentTarget = e.currentTarget;
      setTimeout(() => {
        if (!currentTarget.contains(document.activeElement)) {
          exitEditMode();
        }
      }, 0);
    },
  }),
  loadingUntil(({ isLoading }) => !isLoading)
);

export const EnhancedIsomorphicEditComponent = editingHoC(
  IsomorphicEditComponent
);

const Editable = (props) => {
  const {
    value,
    ViewComponent,
    viewClassName,
    isInEditingMode,
    setEditingMode,
    isEditEnabled,
    useEditIcon,
    editIconClassName,
    editInDialog,
    ...other
  } = props;
  return (
    <>
      {isInEditingMode ? <EnhancedIsomorphicEditComponent {...props} /> : null}
      {
        // If in edit mode, do not render the view component, unless the edit is on a dialog
        !isInEditingMode || editInDialog ? (
          <div onClick={isEditEnabled ? () => setEditingMode(true) : undefined}>
            <div className={isEditEnabled ? 'data-item can-edit' : ''}>
              <ViewComponent
                value={value}
                className={viewClassName}
                {...other}
              />
              {useEditIcon && isEditEnabled ? (
                <i
                  className={editIconClassName}
                  onClick={() => setEditingMode(true)}
                />
              ) : null}
            </div>
          </div>
        ) : null
      }
    </>
  );
};

Editable.propTypes = {
  value: PropTypes.any.isRequired,
  viewComponent: PropTypes.element.isRequired,
  editComponent: PropTypes.element.isRequired,
  editClassName: PropTypes.string,
  viewClassName: PropTypes.string,
  onChangeError: PropTypes.func,
  onChangeSuccess: PropTypes.func,
  isEditEnabled: PropTypes.bool,
  useEditIcon: PropTypes.bool,
  editIconClassName: PropTypes.string,
  editInDialog: PropTypes.bool,
  /**
   * A Joi schema object to be used to validate input
   */
  validationSchema: PropTypes.object,
};

Editable.defaultProps = {
  onChangeError: _.noop,
  onChangeSuccess: _.noop,
  editClassName: 'editor',
  viewClassName: undefined,
  isEditEnabled: true,
  useEditIcon: false,
  editIconClassName: 'pi pi-pencil edit-btn',
  editInDialog: false,
  validationSchema: undefined,
};

export default withState('isInEditingMode', 'setEditingMode', false)(Editable);
