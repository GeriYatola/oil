import { logInfo } from './scripts/log.js';
import { POI_FALLBACK_NAME, POI_FALLBACK_GROUP_NAME } from './scripts/constants.js';
import { setPoiOptIn, getPoiOptIn } from './scripts/cookies.js';
import { registerMessageListener, removeMessageListener, getLocationParam } from './scripts/utils.js';

(function () {
  if (isPoiFallback()) {

    let groupName = '';
    if (location.search.substr(1).indexOf(POI_FALLBACK_GROUP_NAME) !== -1) {
      groupName = getLocationParam(POI_FALLBACK_GROUP_NAME);
    }

    logInfo('Doing fallback round trip for init OilHub');

    setPoiOptIn(true, groupName);

    // To make it visible: setTimeout(function(){ window.location.replace(document.referrer); }, 2000);
    window.location.replace(document.referrer);
  } else {
    logInfo('Init OilHub');
    initOilHub();
  }
}());

let initComplete = false;

export function isPoiFallback() {
  return location.search && location.search.substr(1) && location.search.substr(1).indexOf(POI_FALLBACK_NAME) !== -1;
}

export function initOilHub() {
  if (!initComplete) {
    removeMessageListener(handlerFunction);
    registerMessageListener(handlerFunction);
  }
}

export function handlerFunction(message) {
  let parsedMessage = parseJson(message.data),
      poiOptin = null;

  logInfo('OIL Hub - Got following parent data:', parsedMessage);
  // only react on our data
  // tag::hub-listener[]
  if (parsedMessage) {
    if (parsedMessage.event && parsedMessage.event.indexOf('oil-') !== -1) {

      let event       = parsedMessage.event,
          origin      = parsedMessage.origin,
          groupName   = parsedMessage.group_name;

      switch (event) {
        case 'oil-poi-activate':
          logInfo('OIL Hub - activating POI ');
          setPoiOptIn(true, groupName);
          break;
        case 'oil-status-read':
          poiOptin = getPoiOptIn(groupName);
          logInfo('OIL Hub - read the following poi status:', poiOptin);
          parent.postMessage(JSON.stringify(poiOptin) || false, origin);
          break;
        default:
          break;
      }
    }
    // end::hub-listener[]
    initComplete = true;
  }
}

export function parseJson(data) {
  try {
    return (typeof data !== 'object' ? JSON.parse(data) : data);
  } catch (err) {
    logInfo('OIL Hub - couldnt parse following data:', data);
    return false;
  }
}
