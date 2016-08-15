export default function BasicConfig(actions, provider) {
  this.actions = actions;
  this.provider = provider;
  
  this.beforeRequest = (apiObj, dispatch, getState) => {
    validate(apiObj, 'request');
    if (apiObj.beforeRequest) {
      apiObj.beforeRequest(apiObj, dispatch, getState);
    }
    dispatch({type: apiObj.actionTypes.request});
  };
    
  this.onSuccess = (response, apiObj, dispatch, getState) => {
    validate(apiObj, 'success');
    if (apiObj.onSuccess) {
      apiObj.onSuccess(response, apiObj, dispatch, getState);
    }
    let meta = { ...response };
    delete meta.data;
    dispatch({
      type: apiObj.actionTypes.success,
      payload: response.data,
      meta
    });
  };
  
  this.onFailure = (response, apiObj, dispatch, getState) => {
    validate(apiObj, 'failure');
    if (apiObj.onFailure) {
      apiObj.onFailure(response, apiObj, dispatch, getState);
    }
    let meta = { ...response };
    delete meta.data;
    dispatch({
      type: apiObj.actionTypes.failure,
      payload: response.data || response,
      error: true,
      meta
    });
  }
  
  function validate(apiObj, type) {
    if (!apiObj ||
        !apiObj.actionTypes ||
        !apiObj.actionTypes[type]) {
      throw new Error(`${JSON.stringify(apiObj)} 'actionTypes' must have '${type}' property`);
    }
  }
}
