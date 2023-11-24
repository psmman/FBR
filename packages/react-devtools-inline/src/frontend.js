/** @flow */

import * as React from 'react';
import {forwardRef} from 'react';
import Bridge from 'react-devtools-shared/src/bridge';
import Store from 'react-devtools-shared/src/devtools/store';
import DevTools from 'react-devtools-shared/src/devtools/views/DevTools';
import {
  getAppendComponentStack,
  getBreakOnConsoleErrors,
  getSavedComponentFilters,
  getShowInlineWarningsAndErrors,
  getHideConsoleLogsInStrictMode,
} from 'react-devtools-shared/src/utils';

import type {Wall} from 'react-devtools-shared/src/frontend/types';
import type {FrontendBridge} from 'react-devtools-shared/src/bridge';
import type {Props} from 'react-devtools-shared/src/devtools/views/DevTools';

type Config = {
  checkBridgeProtocolCompatibility?: boolean,
  supportsNativeInspection?: boolean,
  supportsProfiling?: boolean,
  supportsReloadAndProfile?: boolean,
  isProfiling?: boolean,
};

export function createStore(bridge: FrontendBridge, config?: Config): Store {
  return new Store(bridge, {
    checkBridgeProtocolCompatibility: true,
    supportsTraceUpdates: true,
    supportsTimeline: true,
    supportsNativeInspection: true,
    supportsReloadAndProfile: true,
    ...config,
  });
}

export function createBridge(contentWindow: any, wall?: Wall): FrontendBridge {
  if (wall == null) {
    wall = {
      listen(fn) {
        // $FlowFixMe[missing-local-annot]
        const onMessage = ({data}) => {
          fn(data);
        };
        window.addEventListener('message', onMessage);
        return () => {
          window.removeEventListener('message', onMessage);
        };
      },
      send(event: string, payload: any, transferable?: Array<any>) {
        contentWindow.postMessage({event, payload}, '*', transferable);
      },
    };
  }

  return (new Bridge(wall): FrontendBridge);
}

export function initialize(
  contentWindow: any,
  {
    createBridge: customCreateBridge,
    createStore: customCreateStore,
    reload,
  }: {
    createBridge?: () => FrontendBridge,
    createStore?: (bridge: FrontendBridge, isProfiling: boolean) => Store,
    reload?: (initializeFrontend: () => void) => void,
  } = {},
): React.AbstractComponent<Props, mixed> {
  let frontendBridge: FrontendBridge;
  let frontendStore;

  function init(isProfiling: boolean) {
    if (customCreateBridge) {
      frontendBridge = customCreateBridge();
    } else {
      frontendBridge = (createBridge(contentWindow): FrontendBridge);
    }
    if (customCreateStore) {
      frontendStore = customCreateStore(frontendBridge, isProfiling);
    } else {
      frontendStore = createStore(frontendBridge, {
        supportsReloadAndProfile: !!reload,
        isProfiling,
      });
    }
    frontendBridge.addListener('getSavedPreferences', onGetSavedPreferences);

    if (reload) {
      frontendBridge.addListener('reloadAppForProfiling', () => {
        frontendBridge.shutdown();
        reload(() => {
          init(true);
          ReInitEvent.dispatchEvent(new Event('change'));
        });
      });
    }
  }
  init(false);

  function onGetSavedPreferences() {
    // This is the only message we're listening for,
    // so it's safe to cleanup after we've received it.
    frontendBridge.removeListener('getSavedPreferences', onGetSavedPreferences);

    const data = {
      appendComponentStack: getAppendComponentStack(),
      breakOnConsoleErrors: getBreakOnConsoleErrors(),
      componentFilters: getSavedComponentFilters(),
      showInlineWarningsAndErrors: getShowInlineWarningsAndErrors(),
      hideConsoleLogsInStrictMode: getHideConsoleLogsInStrictMode(),
    };

    // The renderer interface can't read saved preferences directly,
    // because they are stored in localStorage within the context of the extension.
    // Instead it relies on the extension to pass them through.
    frontendBridge.send('savedPreferences', data);
  }

  const ReInitEvent = new EventTarget();
  const ForwardRef = forwardRef<Props, mixed>((props, ref) => {
    const [key, setKey] = React.useState(0);
    React.useEffect(() => {
      function f() {
        setKey(count => count + 1);
      }
      ReInitEvent.addEventListener('change', f);
      return () => ReInitEvent.removeEventListener('change', f);
    }, []);
    return (
      <DevTools
        ref={ref}
        // get the latest bridge and store when initCount is changed.
        bridge={frontendBridge}
        store={frontendStore}
        {...props}
        key={key}
      />
    );
  });
  ForwardRef.displayName = 'DevTools';

  return ForwardRef;
}
