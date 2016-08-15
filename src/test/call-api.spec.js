import { expect } from 'chai'
import { Promise } from 'es6-promise'

import CallApi from '../call-api'

describe('CallApi', function() {
  let api;
  let config;
    
  beforeEach(function() {
    api = new CallApi(config);
    config = {
      provider: {
        request: (reqObj) => {
          return new Promise((resolve, reject) => {
            if (reqObj && reqObj.bad) {
              reject(new Error('go away'));
            } else {
              resolve({data: 'foo'});
            }
          });
        }
      },
      actions: {
        'FOO': {
          makeApiObj: (action) => {
            let isBad = false;
            if (action && action.payload) isBad = action.payload.bad;
            return {
              request: {url: 'foo', method: 'bar', bad: isBad}              
            }
          }
        },
        'BAD': {
          makeApiObj: () => {}
        }
      }
    };
  });
  
  it('expects that provider`s `request` function returns a promise', function() {
    return config.provider.request()
      .then(() => {
        throw new Error();
      })
      .catch(() => {});      
  });
  
  describe('#constructor', function() {
    it('assigns config to the property if config is defined', function() {
      const ca = new CallApi(config);
      expect(ca.config).to.equal(config);
    });

    it('does not set a config if it is undefined', function() {
      const ca = new CallApi();
      expect(ca.config).to.be.undefined;
    });
  });
  
  describe('#config', function() {
    it('assigns config to the property', function() {
      const ca = new CallApi();
      ca.config = config;
      expect(ca.config).to.equal(config);
    });

    it('throws if config is invalid and does not assign it', function() {
      const badConfig1 = { bad: true };
      const badConfig2 = { actions: {
        'TEST': { bad: true }
      }};
      expect(() => api.config = undefined).to.throw();
      expect(() => api.config = badConfig1).to.throw();
      expect(() => api.config = badConfig2).to.throw(); 
    });
  });
  
  describe('#request', function() {
    it('throws if config is missing', function() {
      const a = new CallApi();
      const fn = () => a.request({type: 'FOO'});
      expect(fn).to.throw();
    });
    
    it('throws if action type is not found in config actions', function() {
      const fn = () => api.request({type: 'UNKNOWN'});
      expect(fn).to.throw();
    });
    
    describe('when finds matching action', function() {
      it('calls action`s `makeApiObj` function with the action object', function() {
        const testAction = {type: 'TEST', meta: 'foo'};
        let isCalled = false;
        const makeApiObj = (action) => { 
          isCalled = true; 
          expect(action).to.eql(testAction);
          return {
            request: () => {}
          }
        };
        config.actions.TEST = { makeApiObj };
        api.config = config;
        api.request(testAction);
        expect(isCalled).to.be.true;
      });
      
      it('throws if action`s `makeApiObj` function does not return an object with `request` property', function() {
        const fn = () => api.request({type: 'BAD'});
        expect(fn).to.throw();
        expect(fn).to.not.throw(/undefined/);
      });
      
      it('calls `beforeRequest` function', function() {
        const obj = config.actions.FOO.makeApiObj();
        let isCalled = false;
        const fn = (apiObj) => {
          isCalled = true;
          expect(apiObj).to.eql(obj);
        };
        api.beforeRequest = fn;
        api.request({type: 'FOO'});
        expect(isCalled).to.be.true;
      });
      
      it('calls provider`s `request` function with a request object', function() {
        const obj = config.actions.FOO.makeApiObj().request;
        let isCalled = false;
        config.provider = {
          request: (reqObj) => {
            isCalled = true;
            expect(reqObj).to.eql(obj);
            return new Promise(resolve => { resolve(); });
          }
        };
        api.config = config;
        return api.request({type: 'FOO'})
          .then(() => { expect(isCalled).to.be.true; });
      });
      
      describe('when request succeeds', function() {
        it('calls `onSuccess` function', function() {
          const obj = config.actions.FOO.makeApiObj();
          let isCalled = false;
          const fn = (response, apiObj) => {
            isCalled = true;
            expect(apiObj).to.eql(obj);
          };
          api.onSuccess = fn;
          return api.request({type: 'FOO'})
            .then(() => { expect(isCalled).to.be.true; });
        });
      });
      
      describe('when request fails', function() {
        it('calls `onFailure` function', function() {
          const obj = config.actions.FOO.makeApiObj({payload: {bad: true}});
          let isCalled = false;
          const fn = (response, apiObj) => {
            isCalled = true;
            expect(apiObj).to.eql(obj);
          };
          api.onFailure = fn;
          return api.request({type: 'FOO', payload: {bad: true}})
            .then(() => { expect(isCalled).to.be.true; });
        });
      });
    });
  });
  
  describe('#beforeRequest', function() {
    it('by default calls config`s `beforeRequest` function if it exists', function() {
      let isCalled = false;
      api.config.beforeRequest = () => { isCalled = true; };
      api.beforeRequest();
      expect(isCalled).to.be.true;
      
      isCalled = false;
      api.config.beforeRequest = undefined;
      api.beforeRequest();
      expect(isCalled).to.be.false;
    });
  });
  
  describe('#onSuccess', function() {
    it('by default calls config`s `onSuccess` function if it exists', function() {
      let isCalled = false;
      api.config.onSuccess = () => { isCalled = true; };
      api.onSuccess();
      expect(isCalled).to.be.true;
      
      isCalled = false;
      api.config.onSuccess = undefined;
      api.onSuccess();
      expect(isCalled).to.be.false;
    });
  });
  
  describe('#onFailure', function() {
    it('by default calls config`s `onFailure` function if it exists', function() {
      let isCalled = false;
      api.config.onFailure = () => { isCalled = true; };
      api.onFailure();
      expect(isCalled).to.be.true;
      
      isCalled = false;
      api.config.onFailure = undefined;
      api.onFailure();
      expect(isCalled).to.be.false;
    });
  });
});