import { getRenewalQueue, saveToRenewalQueue } from '../db/renewalQueue';

const SET_RENEWAL_QUEUE = 'app/renewalQueue/setRenewalQueue';

const initialState = {
  names: [],
};

export const loadRenewalQueue = (network) => async (dispatch, getState) => {
  const { wid } = getState().wallet;
  const data = await getRenewalQueue(network, wid);
  dispatch({
    type: SET_RENEWAL_QUEUE,
    payload: Array.isArray(data) ? data : [],
  });
};

export const addToRenewalQueue = (names, network) => async (dispatch, getState) => {
  const { wid } = getState().wallet;
  const currentQueue = await getRenewalQueue(network, wid) || [];
  const uniqNames = [...new Set([...currentQueue, ...names])];
  await saveToRenewalQueue(network, uniqNames, wid);
  dispatch({
    type: SET_RENEWAL_QUEUE,
    payload: uniqNames,
  });
};

export const removeFromRenewalQueue = (name, network) => async (dispatch, getState) => {
  const { wid } = getState().wallet;
  const currentQueue = await getRenewalQueue(network, wid) || [];
  const updatedQueue = currentQueue.filter(n => n !== name);
  await saveToRenewalQueue(network, updatedQueue, wid);
  dispatch({
    type: SET_RENEWAL_QUEUE,
    payload: updatedQueue,
  });
};

export const clearRenewalQueue = (network) => async (dispatch, getState) => {
  const { wid } = getState().wallet;
  await saveToRenewalQueue(network, [], wid);
  dispatch({
    type: SET_RENEWAL_QUEUE,
    payload: [],
  });
};

export default function renewalQueueReducer(state = initialState, action) {
  const { type, payload } = action;
  switch (type) {
    case SET_RENEWAL_QUEUE:
      return {
        ...state,
        names: payload,
      };
    default:
      return state;
  }
}
