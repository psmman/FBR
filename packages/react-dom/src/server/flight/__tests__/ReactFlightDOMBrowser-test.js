/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

// Polyfills for test environment
global.ReadableStream = require('@mattiasbuelens/web-streams-polyfill/ponyfill/es6').ReadableStream;
global.TextEncoder = require('util').TextEncoder;

let React;
let ReactFlightDOM;

describe('ReactFlightDOM', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactFlightDOM = require('react-dom/unstable-flight.browser');
  });

  async function readResult(stream) {
    let reader = stream.getReader();
    let result = '';
    while (true) {
      let {done, value} = await reader.read();
      if (done) {
        return result;
      }
      result += Buffer.from(value).toString('utf8');
    }
  }

  it('should call renderToReadableStream', async () => {
    let stream = ReactFlightDOM.renderToReadableStream(<div>hello world</div>);
    let result = await readResult(stream);
    expect(result).toBe('<div>hello world</div>');
  });
});
