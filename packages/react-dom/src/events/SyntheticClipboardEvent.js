/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

var SyntheticEvent = require('events/SyntheticEvent');

/**
 * @interface Event
 * @see http://www.w3.org/TR/clipboard-apis/
 */
var ClipboardEventInterface = {
  clipboardData: function(event) {
    if ('clipboardData' in event) {
      return event.clipboardData;
    }
    var doc = (event.target && event.target.ownerDocument) || document;
    return doc.defaultView.clipboardData;
  },
};

/**
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticEvent}
 */
function SyntheticClipboardEvent(
  dispatchConfig,
  dispatchMarker,
  nativeEvent,
  nativeEventTarget,
) {
  return SyntheticEvent.call(
    this,
    dispatchConfig,
    dispatchMarker,
    nativeEvent,
    nativeEventTarget,
  );
}

SyntheticEvent.augmentClass(SyntheticClipboardEvent, ClipboardEventInterface);

module.exports = SyntheticClipboardEvent;
