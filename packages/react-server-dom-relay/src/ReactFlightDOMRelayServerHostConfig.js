/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {RowEncoding, JSONValue} from './ReactFlightDOMRelayProtocol';

import type {Request, ReactModel} from 'react-server/src/ReactFlightServer';

import JSResourceReference from 'JSResourceReference';

import hasOwnProperty from 'shared/hasOwnProperty';
import isArray from 'shared/isArray';

export type ModuleReference<T> = JSResourceReference<T>;

import type {
  Destination,
  BundlerConfig,
  ModuleMetaData,
} from 'ReactFlightDOMRelayServerIntegration';

import {resolveModelToJSON} from 'react-server/src/ReactFlightServer';

import {
  emitRow,
  resolveModuleMetaData as resolveModuleMetaDataImpl,
  close,
} from 'ReactFlightDOMRelayServerIntegration';

export type {
  Destination,
  BundlerConfig,
  ModuleMetaData,
} from 'ReactFlightDOMRelayServerIntegration';

export function isModuleReference(reference: Object): boolean {
  return reference instanceof JSResourceReference;
}

export type ModuleKey = ModuleReference<any>;

export function getModuleKey(reference: ModuleReference<any>): ModuleKey {
  // We use the reference object itself as the key because we assume the
  // object will be cached by the bundler runtime.
  return reference;
}

export function resolveModuleMetaData<T>(
  config: BundlerConfig,
  resource: ModuleReference<T>,
): ModuleMetaData {
  return resolveModuleMetaDataImpl(config, resource);
}

export type Chunk = RowEncoding;

export function processErrorChunk(
  request: Request,
  id: number,
  message: string,
  stack: string,
): Chunk {
  return [
    'E',
    id,
    {
      message,
      stack,
    },
  ];
}

export function processModelChunk(
  request: Request,
  id: number,
  jsonValue: JSONValue,
): Chunk {
  return ['J', id, jsonValue];
}

export function processModuleChunk(
  request: Request,
  id: number,
  moduleMetaData: ModuleMetaData,
): Chunk {
  // The moduleMetaData is already a JSON serializable value.
  return ['M', id, moduleMetaData];
}

export function processSymbolChunk(
  request: Request,
  id: number,
  name: string,
): Chunk {
  return ['S', id, name];
}

export function scheduleWork(callback: () => void) {
  callback();
}

export function flushBuffered(destination: Destination) {}

export function beginWriting(destination: Destination) {}

export function writeChunk(destination: Destination, chunk: Chunk): void {
  emitRow(destination, chunk);
}

export function writeChunkAndReturn(
  destination: Destination,
  chunk: Chunk,
): boolean {
  emitRow(destination, chunk);
  return true;
}

export function completeWriting(destination: Destination) {}

export {close};

export function closeWithError(destination: Destination, error: mixed): void {
  close(destination);
}
