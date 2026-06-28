import { clientStub } from '../background/db/client';

const dbClient = clientStub(() => require('electron').ipcRenderer);

export const getRenewalQueue = async (network, wid) => {
  if (wid) {
    const userQueue = await dbClient.get(prefixRenewalQueue(network, wid));
    if (userQueue) {
      return userQueue;
    }
    // Fallback/migration from global legacy queue
    const globalQueue = await dbClient.get(prefixRenewalQueue(network));
    if (globalQueue) {
      await dbClient.put(prefixRenewalQueue(network, wid), globalQueue);
      return globalQueue;
    }
  }
  return dbClient.get(prefixRenewalQueue(network, wid));
};

export const saveToRenewalQueue = async (network, newList, wid) => {
  return dbClient.put(prefixRenewalQueue(network, wid), newList);
};

const prefixRenewalQueue = (network, wid) => {
  return wid ? `renewalQueue:${wid}:${network}` : `renewalQueue:${network}`;
};
