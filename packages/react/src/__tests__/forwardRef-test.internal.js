/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

describe('forwardRef', () => {
  let React;
  let ReactFeatureFlags;
  let ReactNoop;

  function normalizeCodeLocInfo(str) {
    return str && str.replace(/\(at .+?:\d+\)/g, '(at **)');
  }

  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
    React = require('react');
    ReactNoop = require('react-noop-renderer');
  });

  it('should work without a ref to be forwarded', () => {
    class Child extends React.Component {
      render() {
        ReactNoop.yield(this.props.value);
        return null;
      }
    }

    function Wrapper(props) {
      return <Child {...props} ref={props.forwardedRef} />;
    }

    const RefForwardingComponent = React.forwardRef((props, ref) => (
      <Wrapper {...props} forwardedRef={ref} />
    ));

    ReactNoop.render(<RefForwardingComponent value={123} />);
    expect(ReactNoop.flush()).toEqual([123]);
  });

  it('should forward a ref to a chosen component', () => {
    class Child extends React.Component {
      render() {
        ReactNoop.yield(this.props.value);
        return null;
      }
    }

    function Wrapper(props) {
      return <Child {...props} ref={props.forwardedRef} />;
    }

    const RefForwardingComponent = React.forwardRef((props, ref) => (
      <Wrapper {...props} forwardedRef={ref} />
    ));

    const ref = React.createRef();

    ReactNoop.render(<RefForwardingComponent ref={ref} value={123} />);
    expect(ReactNoop.flush()).toEqual([123]);
    expect(ref.value instanceof Child).toBe(true);
  });

  it('should maintain ref through updates', () => {
    class Child extends React.Component {
      render() {
        ReactNoop.yield(this.props.value);
        return null;
      }
    }

    function Wrapper(props) {
      return <Child {...props} ref={props.forwardedRef} />;
    }

    const RefForwardingComponent = React.forwardRef((props, ref) => (
      <Wrapper {...props} forwardedRef={ref} />
    ));

    let setRefCount = 0;
    let ref;

    const setRef = r => {
      setRefCount++;
      ref = r;
    };

    ReactNoop.render(<RefForwardingComponent ref={setRef} value={123} />);
    expect(ReactNoop.flush()).toEqual([123]);
    expect(ref instanceof Child).toBe(true);
    expect(setRefCount).toBe(1);
    ReactNoop.render(<RefForwardingComponent ref={setRef} value={456} />);
    expect(ReactNoop.flush()).toEqual([456]);
    expect(ref instanceof Child).toBe(true);
    expect(setRefCount).toBe(1);
  });

  it('should not break lifecycle error handling', () => {
    class ErrorBoundary extends React.Component {
      state = {error: null};
      componentDidCatch(error) {
        ReactNoop.yield('ErrorBoundary.componentDidCatch');
        this.setState({error});
      }
      render() {
        if (this.state.error) {
          ReactNoop.yield('ErrorBoundary.render: catch');
          return null;
        }
        ReactNoop.yield('ErrorBoundary.render: try');
        return this.props.children;
      }
    }

    class BadRender extends React.Component {
      render() {
        ReactNoop.yield('BadRender throw');
        throw new Error('oops!');
      }
    }

    function Wrapper(props) {
      ReactNoop.yield('Wrapper');
      return <BadRender {...props} ref={props.forwardedRef} />;
    }

    const RefForwardingComponent = React.forwardRef((props, ref) => (
      <Wrapper {...props} forwardedRef={ref} />
    ));

    const ref = React.createRef();

    ReactNoop.render(
      <ErrorBoundary>
        <RefForwardingComponent ref={ref} />
      </ErrorBoundary>,
    );
    expect(ReactNoop.flush()).toEqual([
      'ErrorBoundary.render: try',
      'Wrapper',
      'BadRender throw',
      'ErrorBoundary.componentDidCatch',
      'ErrorBoundary.render: catch',
    ]);
    expect(ref.value).toBe(null);
  });

  it('should support rendering null', () => {
    const RefForwardingComponent = React.forwardRef((props, ref) => null);

    const ref = React.createRef();

    ReactNoop.render(<RefForwardingComponent ref={ref} />);
    ReactNoop.flush();
    expect(ref.value).toBe(null);
  });

  it('should warn if not provided a callback during creation', () => {
    expect(() => React.forwardRef(undefined)).toWarnDev(
      'forwardRef requires a render function but was given undefined.',
    );
    expect(() => React.forwardRef(null)).toWarnDev(
      'forwardRef requires a render function but was given null.',
    );
    expect(() => React.forwardRef('foo')).toWarnDev(
      'forwardRef requires a render function but was given string.',
    );
  });

  it('should error with a callstack if rendered without a function', () => {
    let RefForwardingComponent;
    expect(() => {
      RefForwardingComponent = React.forwardRef();
    }).toWarnDev(
      'forwardRef requires a render function but was given undefined.',
    );

    ReactNoop.render(
      <div>
        <RefForwardingComponent />
      </div>,
    );

    let caughtError;
    try {
      ReactNoop.flush();
    } catch (error) {
      caughtError = error;
    }
    expect(caughtError).toBeDefined();
    expect(normalizeCodeLocInfo(caughtError.message)).toBe(
      'forwardRef requires a render function but was given undefined.' +
        (__DEV__ ? '\n    in div (at **)' : ''),
    );
  });
});
