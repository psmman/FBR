/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactReconciler
 */

'use strict';

var ReactRef = require('ReactRef');

/**
 * Helper to call ReactRef.attachRefs with this composite component, split out
 * to avoid allocations in the transaction mount-ready queue.
 */
function attachRefs() {
  ReactRef.attachRefs(this, this._currentElement);
}

var lazyTreeImpls = {};

var ReactReconciler = {

  /**
   * Initializes the component, renders markup, and registers event listeners.
   *
   * @param {ReactComponent} internalInstance
   * @param {ReactReconcileTransaction|ReactServerRenderingTransaction} transaction
   * @param {?object} the containing native component instance
   * @param {?object} info about the native container
   * @return {?string} Rendered markup to be inserted into the DOM.
   * @final
   * @internal
   */
  mountComponent: function(
    internalInstance,
    transaction,
    nativeParent,
    nativeContainerInfo,
    context
  ) {
    var child = internalInstance.mountComponent(
      transaction,
      nativeParent,
      nativeContainerInfo,
      context
    );

    if (internalInstance._currentElement &&
        internalInstance._currentElement.ref != null) {
      transaction.getReactMountReady().enqueue(attachRefs, internalInstance);
    }

    var join = true;
    if (!Array.isArray(child)) {
      child = [child];
      join = false;
    }
    var processedChildren = child.map(function processChild(childOfChild) {
      return ReactReconciler.processChild(
        childOfChild,
        internalInstance,
        transaction,
        nativeParent,
        nativeContainerInfo,
        context
      );
    });

    return join ? processedChildren.join('') : processedChildren[0];
  },

  processChild: function(
    child,
    internalInstance,
    transaction,
    nativeParent,
    nativeContainerInfo,
    context
  ) {
    if ('string' === typeof child || 'number' === typeof child) {
      return child;
    } else if (child.lazy) {
      var lazyImpl = lazyTreeImpls[child.lazy];
      // DOMLazyTree
      if (child.html) {
        // dangerouslySetInnerHTML
        lazyImpl.queueHTML(child, child.html);
      } else if (child.text) {
        // ReactTextComponent
        lazyImpl.queueText(child, child.text);
      } else if (child.children) {
        // ReactDOMComponent
        for (var i=0; i<child.children.length; ++i) {
          var childOfChild = child.children[i];
          var childMountImage = ReactReconciler.mountComponent(
            childOfChild,
            transaction,
            internalInstance,
            internalInstance._nativeContainerInfo,
            internalInstance._processChildContext ?
              internalInstance._processChildContext(context) : context,
          );
          lazyImpl.queueChild(child, childMountImage);

          if (internalInstance.postMount) {
            internalInstance.postMount(transaction);
          }
        }
      } else {
        throw new Error('Unknown child type');
      }
      return child;
    } else {
      // ReactCompositeComponent
      var mountImage = ReactReconciler.mountComponent(
        child,
        transaction,
        nativeParent,
        internalInstance._nativeContainerInfo,
        internalInstance._processChildContext ?
          internalInstance._processChildContext(context) : context,
      );

      if (internalInstance.postMount) {
        internalInstance.postMount(transaction);
      }

      return mountImage;
    }
  },

  /**
   * Returns a value that can be passed to
   * ReactComponentEnvironment.replaceNodeWithMarkup.
   */
  getNativeNode: function(internalInstance) {
    return internalInstance.getNativeNode();
  },

  /**
   * Releases any resources allocated by `mountComponent`.
   *
   * @final
   * @internal
   */
  unmountComponent: function(internalInstance) {
    ReactRef.detachRefs(internalInstance, internalInstance._currentElement);
    return internalInstance.unmountComponent();
  },

  /**
   * Update a component using a new element.
   *
   * @param {ReactComponent} internalInstance
   * @param {ReactElement} nextElement
   * @param {ReactReconcileTransaction} transaction
   * @param {object} context
   * @internal
   */
  receiveComponent: function(
    internalInstance, nextElement, transaction, context
  ) {
    var prevElement = internalInstance._currentElement;

    if (nextElement === prevElement &&
        context === internalInstance._context
      ) {
      // Since elements are immutable after the owner is rendered,
      // we can do a cheap identity compare here to determine if this is a
      // superfluous reconcile. It's possible for state to be mutable but such
      // change should trigger an update of the owner which would recreate
      // the element. We explicitly check for the existence of an owner since
      // it's possible for an element created outside a composite to be
      // deeply mutated and reused.

      // TODO: Bailing out early is just a perf optimization right?
      // TODO: Removing the return statement should affect correctness?
      return;
    }

    var refsChanged = ReactRef.shouldUpdateRefs(
      prevElement,
      nextElement
    );

    if (refsChanged) {
      ReactRef.detachRefs(internalInstance, prevElement);
    }

    internalInstance.receiveComponent(nextElement, transaction, context);

    if (refsChanged &&
        internalInstance._currentElement &&
        internalInstance._currentElement.ref != null) {
      transaction.getReactMountReady().enqueue(attachRefs, internalInstance);
    }
  },

  /**
   * Flush any dirty changes in a component.
   *
   * @param {ReactComponent} internalInstance
   * @param {ReactReconcileTransaction} transaction
   * @internal
   */
  performUpdateIfNecessary: function(
    internalInstance,
    transaction
  ) {
    internalInstance.performUpdateIfNecessary(transaction);
  },

  injection: {
    injectLazyTreeImpl: function(lazyTreeImpl) {
      lazyTreeImpls[lazyTreeImpl.treeType] = lazyTreeImpl;
    },
  },

};

module.exports = ReactReconciler;
