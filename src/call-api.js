export default function CallApi(config) {
  this._config = undefined;
  
  this.beforeRequest = function(apiObj, dispatch, getState) {
    const { config } = this;
    if (config.beforeRequest) {
      config.beforeRequest(apiObj, dispatch, getState);
    }
  };
  
  this.onSuccess = function(response, apiObj, dispatch, getState) {
    const { config } = this;
    if (config.onSuccess) {
      config.onSuccess(response, apiObj, dispatch, getState);
    }
  };
  
  this.onFailure = function(response, apiObj, dispatch, getState) {
    const { config } = this;
    if (config.onFailure) {
      config.onFailure(response, apiObj, dispatch, getState);
    }
  };
  
  this.request = function(action, dispatch, getState) {
    const { config } = this;
    if (!config) {
      throw new Error('You must set a `config` property');
    }
    const entry = config.actions[action.type];
    if (!entry) {
      throw new Error(`Action ${action.type} is not in the config actions list`);
    }
    const apiObj = entry.makeApiObj(action);
    this.beforeRequest(apiObj, dispatch, getState);
    if (!apiObj || !apiObj.request) {
      throw new Error('apiObj must be an object with a `request` property');
    }
    return config.provider.request(apiObj.request)
      .then(
        (response) => { this.onSuccess(response, apiObj, dispatch, getState); },
        (response) => { this.onFailure(response, apiObj, dispatch, getState); }
      );
  };

  function validateConfig(config) {
    if (!config) {
      throw new Error('Config can not be undefined');
    }
    if (typeof config.actions !== 'object') {
      throw new Error('Config must have `actions` object');
    }
    Object.keys(config.actions).forEach(k => {
      if (typeof config.actions[k].makeApiObj !== 'function') {
        throw new Error('Action must have `makeApiObj` function');
      }
    });
    if (typeof config.provider !== 'object') {
      throw new Error('Config must have `provider` object');
    }
    if (typeof config.provider.request !== 'function') {
      throw new Error('Provider must have `request` function');
    }
  }

  function setConfig(config) {
    validateConfig(config);
    this._config = config;
  }
  
  Object.defineProperties(this, {
    'config': {
      'get': () => this._config,
      'set': setConfig
    }
  });
  
  if (config) this.config = config;
}