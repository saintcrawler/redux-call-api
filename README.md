redux-call-api
==============

Make easy async api calls with redux.

Install it
----------

`npm i -S redux-call-api`

Test it
-------

`git clone https://github.com/saintcrawler/redux-call-api.git && cd redux-call-api`

`npm i && npm test`

Use it
------

First, you need to write a config object.

```javascript
const config = {
  provider: { 
    // `provider` is a required object. It must contain at least `request` function    
    request: (reqObj) => {
      // `reqObj` is created by you (see below)
      // you may do whatever you want here, but must return a promise object
    }
  },
  actions: {
    // `actions` is a required object. It must contain keys, matching `type` prop of redux actions.
    'FOO': {
      makeApiObj: (action) => {
        // again, do whatever you want, but return an object with at least `request` prop.
        return {
          request: {
            // required. This is the `reqObj` which will be passed into `provider.request` function (see above)
            // you may construct it as you want
            url: `/foo/${action.payload.id}/`,
            method: 'post',
            header: ['baz', 'bar']
          }
        }
      }
    }
  },
  // here go optional hook functions
  
  beforeRequest: (apiObj, dispatch, getState) => {
    // `apiObj` is the object returned by `makeApiObj`, pre-process it as you want
    // do not return anything, just modify `apiObj`'s keys
  },
  onSuccess: (response, apiObj, dispatch, getState) => {
    // `response` is whatever `provider.request` returns when resolves
  },
  onFailure: (response, apiObj, dispatch, getState) => {
    // `response` is whatever `provider.request` returns when rejects
  }
};
```

Then, create a `CallApi` object with config and just call `request` function.

```javascript
import CallApi from 'redux-call-api'

const api = new CallApi(config);

const action = {
  type: 'FOO',
  payload: {id: 11}
};

api.request(action, dispatch, getState); // you can obtain `dispatch` and `getState` from redux store
```

Making CallApi more useful
--------------------------

With the config object like above, `request` just calls `makeApiObj` function, gets request object and calls `config.provider.request` function with it. Not very useful for our redux app. That's why you probably want to use `BasicConfig` constructor to create your config object. But it's not mandatory, it's just config with convenient hooks already being set up.

```javascript
import CallApi, {BasicConfig} from 'redux-call-api'

const actions = {
  'FOO': {    
    makeApiObj: function() {
      return {
        // required
        request: {},
        // now, this is required, too
        actionTypes: {
          request: 'FOO_REQUEST',
          success: 'FOO_SUCCESS',
          failure: 'FOO_FAILURE',
        },

        // optional per-action hooks, will be called only for that action
        beforeRequest: (apiObj, dispatch, getState) => {},
        onSuccess: (response, apiObj, dispatch, getState) => {},
        onFailure: (response, apiObj, dispatch, getState) => {}
      }
    }
  }
};

const config = new BasicConfig(actions, provider); // see above for details about `provider`

const api = new CallApi(config);
```

Now, when you call `api.request({type: 'FOO'}, dispatch, getState)`, the following will happen:
  1. 'FOO_REQUEST' action will be dispatched
  2. 'FOO_SUCCESS' action will be dispatched if `config.provider.request` resolves. It will be equal:
  
  ```javascript
  {
    type: 'FOO_SUCCESS',
    payload: response.data,
    meta: metaInfo // response object without `data` key
  }
  ```
  
  3. 'FOO_FAILURE' action will be dispatched if `config.provider.request` rejects. It will be equal:

  ```javascript
  {
    type: 'FOO_FAILURE',
    payload: response.data || response,
    error: true,
    meta: metaInfo // response object without `data` key
  }
  ```

What about provider?
--------------------

Personally, I use [axios](https://github.com/mzabriskie/axios) as my provider, but you can use any other promise-based solution.

```javascript
import axios from 'axios'

const provider = {
  request: (reqObj) => {
    return axios(reqObj); // that's easy
  }
}
```

How do I call `api.request` function automatically?
---------------------------------------------------

You can use [redux-trigger-middleware](https://github.com/saintcrawler/redux-trigger-middleware). Make a trigger config:

```javascript
const triggerConfig = {
  actions: {
    // trigger: 'LOAD_FOO',
    // or you can write a predicate, which will trigger on any action type that begins with 'LOAD'
    trigger: (action) => /^LOAD/.test(action.type),
    handler: (action, dispatch, getState) => api.request(action, dispatch, getState)
  }
};
```

See also
--------

Some use cases
 - [Gist with the example](https://gist.github.com/saintcrawler/53dcb99303dd90daa097b159a6be466f)


License
-------

ISC