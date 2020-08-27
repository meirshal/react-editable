import {
  branch,
  renderComponent,
  compose,
  lifecycle,
  withStateHandlers,
} from 'recompose';
import Spinner from './spinner';

/**
 * LoadingUntil is used when we want to wait for some data to exist until we render our component,
 * While we wait we want to render the loading component.
 *
 * example: loadingUntil(({ data }) => !_.isEmpty(data))
 * In english: until the data exists render the loading component
 */
export const loadingUntil = (
  loadingUntilPredicate,
  loadingComponent = Spinner
) =>
  branch(
    (props) => !loadingUntilPredicate(props),
    renderComponent(loadingComponent)
  );

export const loadingUntilWithTimeout = (
  loadingUntilPredicate,
  loadingComponent = Spinner,
  timeout
) =>
  compose(
    withStateHandlers(
      {
        timeoutId: null,
        timeoutExpired: false,
      },
      {
        saveTimeoutId: () => (timeoutId) => ({ timeoutId }),
        hitTimeoutExpired: () => () => ({ timeoutExpired: true }),
      }
    ),
    lifecycle({
      componentDidMount() {
        const { saveTimeoutId, hitTimeoutExpired } = this.props;

        // we are updating time stamp for re-render to occur in case no other props changed
        const timeoutId = setTimeout(() => hitTimeoutExpired(), timeout);

        saveTimeoutId(timeoutId);
      },
      componentWillUnmount() {
        const { timeoutId } = this.props;

        clearTimeout(timeoutId);
      },
    }),
    branch((props) => {
      const { timeoutExpired } = props;
      if (timeoutExpired) return false;
      return !loadingUntilPredicate(props);
    }, renderComponent(loadingComponent))
  );

/**
 * LoadingWhile is used when we want to wait for a triggered action to finish executing,
 * While we wait we want to render the loading component
 *
 * example: loadingUntil(({ actionTracker }) => actionTracker.inProgress === true))
 * In english: when the action was triggered and didn't finish yet render the loading component
 */
export const loadingWhile = (
  loadingWhilePredicate,
  loadingComponent = Spinner
) =>
  branch(
    (props) => loadingWhilePredicate(props),
    renderComponent(loadingComponent)
  );

export const fetchFailed = (hasError, errorComponent = null) =>
  branch((props) => hasError(props), renderComponent(errorComponent));
