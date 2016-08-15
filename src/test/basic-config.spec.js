import { createStore, applyMiddleware } from 'redux'
import { Promise } from 'es6-promise'
import { expect } from 'chai'
import Trigger from 'redux-trigger'

import CallApi from '../call-api'
import BasicConfig from '../basic-config'

describe('BasicConfig', function() {
  let store;
  let apiConfig;
  const testActionTypes = {
    request: 'REQUEST',
    success: 'SUCCESS',
    failure: 'FAILURE'
  };
  const api = new CallApi();
  const reducer = (state, action) => {
    switch (action.type) {
      case 'REQUEST':
        return { 
          ...state, 
          hasRequested: true 
        }
      case 'SUCCESS':
        return { 
          ...state, 
          hasSucceeded: true, 
          data: action.payload, 
          status: action.meta.status 
        }
      case 'FAILURE':
        return { 
          ...state, 
          hasFailed: true, 
          data: action.payload, 
          error: action.error, 
          status: action.meta.status 
        }
      default:
        return state;
    }
  };
  const trigConfig = {
    actions: [{
      trigger: 'FETCH',
      handler: (action, dispatch) => api.request(action, dispatch)
    }]
  };
  const trigger = new Trigger(trigConfig);
  
  beforeEach(function() {
    store = createStore(reducer, {}, applyMiddleware(trigger.middleware));
    const provider = {
      request: (reqObj) => {
        return new Promise((resolve, reject) => {
          if (reqObj.url === '/0') {
            reject({data: new Error('very bad'), status: 0});
          } else if (reqObj.url === '/404') {
            reject({data: 'not found', status: 404});
          } else {
            resolve({data: 'foo', status: 200});            
          }
        })
      }
    };
    const actions = {
      'FETCH': {
        makeApiObj: (action) => {
          const url = action.meta || '/200'; 
          return { 
            request: { url },
            actionTypes: testActionTypes
          } 
        }
      }
    };
    apiConfig = new BasicConfig(actions, provider);
    api.config = apiConfig;
  });
  
  describe('#constructor', function() {
    it('accepts actions and provider objects and assigns them', function() {
       const actions = {foo: 'bar'};
       const provider = {baz: 'baz'};
       const config = new BasicConfig(actions, provider);
       expect(config.actions).to.eql(actions);
       expect(config.provider).to.eql(provider);
    });
  });
  
  describe('#beforeRequest', function() {
    it('dispatches request action', function() {
      store.dispatch({type: 'FETCH'});
      expect(store.getState()).to.eql({hasRequested: true});  
    });
    
    it('calls apiObj`s `beforeRequest` function if it exists', function() {
      let isCalled = false;
      api.config.actions.FETCH.makeApiObj = () => {
        return {
          actionTypes: testActionTypes,
          request: {},
          beforeRequest: () => isCalled = true
        }
      }
      store.dispatch({type: 'FETCH'});
      expect(isCalled).to.be.true;
    });
  });
  
  describe('#onSuccess', function() {
    it('dispatches success action with data payload and meta', function() {
      return api.request({type: 'FETCH'}, store.dispatch)
        .then(() => { 
          expect(store.getState()).to.eql({
            hasRequested: true, 
            hasSucceeded: true,
            data: 'foo',
            status: 200
          }); 
        });  
    });
    
    it('calls apiObj`s `onSuccess` function if it exists', function() {
      let isCalled = false;
      api.config.actions.FETCH.makeApiObj = () => {
        return {
          actionTypes: testActionTypes,
          request: {},
          onSuccess: () => isCalled = true
        }
      }
      return api.request({type: 'FETCH'}, store.dispatch)
        .then(() => {
          expect(isCalled).to.be.true;
        });
    });
  });
  
  describe('#onFailure', function() {
    it('dispatches failure action with error payload and error flag (404)', function() {
      return api.request({type: 'FETCH', meta: '/404'}, store.dispatch)
        .then(() => {
          expect(store.getState()).to.eql({
            hasRequested: true,
            hasFailed: true,
            error: true,
            data: 'not found',
            status: 404
          });
        })  
    });
    
    it('dispatches failure action with error payload and error flag (0)', function() {
      return api.request({type: 'FETCH', meta: '/0'}, store.dispatch)
        .then(() => {
          expect(store.getState()).to.eql({
            hasRequested: true,
            hasFailed: true,
            error: true,
            data: new Error('very bad'),
            status: 0
          });
        })  
    });
    
    it('calls apiObj`s `onFailure` function if it exists', function() {
      let isCalled = false;
      api.config.actions.FETCH.makeApiObj = () => {
        return {
          actionTypes: testActionTypes,
          request: {url: '/404'},
          onFailure: () => isCalled = true
        }
      }
      return api.request({type: 'FETCH'}, store.dispatch)
        .then(() => {
          expect(isCalled).to.be.true;
        });
    });
  });
});