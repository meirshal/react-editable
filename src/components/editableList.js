import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { withState, compose, withHandlers } from 'recompose';
import { DataView } from 'primereact/dataview';
import { Button } from 'primereact/button';

import Modal from './modal';
import { EnhancedIsomorphicEditComponent } from './editable';
import { isPromise } from '../utils';
import { loadingUntil } from './loadingUntil';

const withDelete = (Component) => (props) => {
  const {
    setItemToDelete,
    onDelete,
    itemToDelete,
    isEditEnabled,
    deleteConformationMessage,
    deleteButtonClassName,
    value,
  } = props;

  return (
    <div className="del-wrapper">
      <Component {...props} />
      {isEditEnabled ? (
        <i
          className={`del ${deleteButtonClassName}`}
          onClick={() => {
            setItemToDelete(value);
          }}
        />
      ) : null}

      {itemToDelete && _.isEqual(itemToDelete, value) ? (
        <Modal className="confirmation-dialog">
          <div className="confirm-prompt">{deleteConformationMessage}</div>
          <div className="confirm-btn-wrapper">
            <Button label="Delete" onClick={() => onDelete(itemToDelete)} />
            <Button label="Cancel" onClick={() => setItemToDelete(null)} />
          </div>
        </Modal>
      ) : null}
    </div>
  );
};

const addPropsToEachItem = ({ values, ...other }) =>
  _.map(values, (value) => ({ value, props: other }));

/**
 * For some reason, PrimeReact's DataView components accepts functions that are not standard components.
 * This is needed to maintain the ability to use react components as list items.
 * **/
const componentToItemTemplate = (Component) => ({ props, value }, layout) =>
  Component({ value, layout, ...props });

const EditableList = (props) => {
  const {
    values,
    EditableItemComponent,
    AddItemComponent,
    onAdd,
    setItemToDelete,
    onDelete,
    onChange,
    isEditEnabled,
    isInAddMode,
    setAddMode,
    isLoading,
    addButtonClassName,
    ...otherProps
  } = props;

  // _.flowRight is the same as recompose's "compose", but is more suitable since we're returning a function
  // that accepts two parameters and not a React component which only accepts one parameter.
  const ItemTemplate = _.flowRight(
    componentToItemTemplate,
    withDelete
  )(EditableItemComponent);

  return (
    <div>
      <DataView
        value={addPropsToEachItem(props)}
        layout="list"
        isEditEnabled={isEditEnabled}
        itemTemplate={ItemTemplate}
      />
      {onAdd && isEditEnabled ? (
        <div className="add-wrapper">
          <i
            className={`add-item ${addButtonClassName}`}
            onClick={() => setAddMode(true)}
          />
        </div>
      ) : null}
      {isInAddMode ? (
        <EnhancedIsomorphicEditComponent
          EditComponent={AddItemComponent}
          isEditEnabled={isEditEnabled}
          isInEditingMode={isInAddMode}
          setEditingMode={setAddMode}
          onChange={onAdd}
          {...otherProps}
        />
      ) : null}
    </div>
  );
};

EditableList.propTypes = {
  /** Can only be a function component due to weird API by PrimeReact's DataView component **/
  EditableItemComponent: PropTypes.func.isRequired,
  /** A component that has the same API as "Edit components",
   * i.e. receives the following props: value, onChange, className **/
  AddItemComponent: PropTypes.element,
  values: PropTypes.array.isRequired,
  isEditEnabled: PropTypes.bool,
  onAdd: PropTypes.func,
  onDelete: PropTypes.func,
  deleteConformationMessage: PropTypes.string,
  deleteButtonClassName: PropTypes.string,
  addButtonClassName: PropTypes.string,
};

EditableList.defaultProps = {
  isEditEnabled: true,
  onAdd: undefined,
  onDelete: undefined,
  deleteButtonClassName: 'pi pi-trash',
  addButtonClassName: 'pi pi-plus-circle',
  deleteConformationMessage: 'Are you sure you want to delete this item?',
};

export default compose(
  withState('isInAddMode', 'setAddMode', false),
  withState('isLoading', 'setIsLoading', false),
  withState('itemToDelete', 'setItemToDelete', false),
  withHandlers({
    onDelete: ({
      onDelete,
      onChangeSuccess,
      onChangeError,
      setIsLoading,
      setItemToDelete,
    }) => (value) => {
      const onChangeResult = onDelete(value);
      if (isPromise(onChangeResult)) {
        setIsLoading(true);
        onChangeResult
          .tap(() => setItemToDelete(null))
          .then(onChangeSuccess)
          .catch(onChangeError)
          .finally(() => setIsLoading(false));
      }
    },
  }),
  loadingUntil(({ isLoading }) => !isLoading)
)(EditableList);
