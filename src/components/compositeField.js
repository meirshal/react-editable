import { compose, withHandlers, withState } from 'recompose';
import _ from 'lodash';

export default compose(
  withState('innerValue', 'setInnerValue', ({ value }) =>
    value ? _.clone(value) : {}
  ),
  withHandlers({
    innerOnChange: ({ onChange, innerValue, setInnerValue }) => (
      fieldName,
      fieldValue
    ) => {
      _.assign(innerValue, { [fieldName]: fieldValue });
      setInnerValue(innerValue);
      onChange(innerValue);
    },
  })
);
