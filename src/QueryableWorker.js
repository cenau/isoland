import webworkify from 'webworkify';
export default QueryableWorker;
//from https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers
function QueryableWorker(webworkermodule, defaultListener, onError) {
      var instance = this,
      worker = webworkify(webworkermodule),
      listeners = {};

      this.defaultListener = defaultListener || function() {};
 
      if (onError) {worker.onerror = onError;}

      this.postMessage = function(message) {
        worker.postMessage(message);
      }

      this.terminate = function() {
        worker.terminate();
      }

      this.addListener = function(name, listener) {
        listeners[name] = listener; 
      }
 
      this.removeListener = function(name) { 
        delete listeners[name];
      }

      /* 
        This functions takes at least one argument, the method name we want to query.
        Then we can pass in the arguments that the method needs.
      */
      this.sendQuery = function() {
        if (arguments.length < 1) {
          throw new TypeError('QueryableWorker.sendQuery takes at least one argument'); 
          return;
        }
        worker.postMessage({
          'queryMethod': arguments[0],
          'queryMethodArguments': Array.prototype.slice.call(arguments, 1)
        });
      }

      worker.onmessage = function(event) {
        if (event.data instanceof Object &&
          event.data.hasOwnProperty('queryMethodListener') &&
          event.data.hasOwnProperty('queryMethodArguments')) {
          listeners[event.data.queryMethodListener].apply(instance, event.data.queryMethodArguments);
        } else {
          this.defaultListener.call(instance, event.data);
        }
      }
    }
