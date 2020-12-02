import Axios from "axios";
import { isLiteralObject } from "__shared-libs/js/modules/validators";

// Send request via Axios and wrap up its response into our customized format
// @params {Boolean} isAPI  parse the body as API response or not, if the
//   request points to an API it will return a formatted JSON, in other cases,
//   for example, the changelog returns raw html string, then this flag
//   should use `false`
export function rawRequest(method, signatures, isAPI = true, proxy = Axios) {
  return new Promise((resolve, reject) => {
    proxy[method](...signatures)
      .then((res) => {
        // parse as API response, i.e. a formatted JSON
        if (isAPI) {
          if (res.data.status === 0) {
            resolve(res.data);
          } else {
            // @params {String} message  error message that can be used directly
            // @params {String} type "service"||"network"  type of the error
            // @params {Object} error either the {status,message} returned from
            // the api or the native error object thrown out by Axios, can be
            // used to inspect the details of the error
            reject({
              message: res.data.message,
              type: "service",
              error: res.data
            });
          }
        } else {
          // else, return the raw data, maybe a string, or a binary stream,
          // depends on the request.
          resolve(res.data);
        }
      })
      .catch((error) => {
        reject({
          message: "Network error detected",
          type: "network",
          error
        });
      });
  });
}

// export an instance, that we can use it right away
export default class APIService {
  constructor(axiosOptions) {
    this.proxy = Axios.create(axiosOptions);
  }

  // proxy the methods to an instance of Axios, that we can configure custom
  // headers in advance if necessary
  get(apiName, ...options) {
    return APIService.request(this.proxy, "get", apiName, ...options);
  }

  post(apiName, ...options) {
    return APIService.request(this.proxy, "post", apiName, ...options);
  }

  put(apiName, ...options) {
    return APIService.request(this.proxy, "put", apiName, ...options);
  }

  delete(apiName, ...options) {
    return APIService.request(this.proxy, "delete", apiName, ...options);
  }

  // patch hasn't been put into use, put should do the trick most of the time
  // also please consider use PUT instead of PATCH, there isn't a significant
  // point to maintain the two approaches at the same time.
  patch() {
    throw new Error($_("Please consider using PUT method"));
  }

  // for static methods, the only difference is they are stateless, which means
  // the proxy will be pointed to Axios itself instead of one of it's instance
  // that accepts configuration like custom headers.
  static get(apiName, ...options) {
    return APIService.request(Axios, "get", apiName, ...options);
  }

  static post(apiName, ...options) {
    return APIService.request(Axios, "post", apiName, ...options);
  }

  static put(apiName, ...options) {
    return APIService.request(Axios, "put", apiName, ...options);
  }

  static delete(apiName, ...options) {
    return APIService.request(Axios, "delete", apiName, ...options);
  }

  static patch() {
    throw new Error($_("Please consider using PUT method"));
  }

  // wire up the api service to the api route resolver
  static resolveApiRoute() {
    // example:
    // import resolveApiRoute from "__libs/js/modules/resolve-api-route";
    // APIService.resolveApiRoute = resolveApiRoute;
    throw new Error(
      "Please wire the APIService up with the APP-level api resolver, " +
        "as described in base.js"
    );
  }

  // apiName is a must have, and should always appear as the first argument
  static resolveOptions(apiName, ...options) {
    // 1. pass in a single object as the 2nd argument
    // 2: pass in arguments sequentially, extract each with the following order
    let { params, query, data, config } =
      isLiteralObject(options[0]) && options.length === 1
        ? options[0]
        : {
            params: options[0],
            query: options[1],
            data: options[2],
            config: options[3]
          };

    params = isLiteralObject(params) ? params : null;
    query = isLiteralObject(query) ? query : null;
    // data can be anything expect nullish value(null and undefined)
    data = typeof data !== "undefined" && data !== null ? data : null;
    config = isLiteralObject(config) ? config : null;

    // merge query params with config object(config takes higher precedency than
    // query params, which means the `params` of the config object will override
    // the `query`)
    if (isLiteralObject(query)) {
      if (isLiteralObject(config)) {
        config.params = isLiteralObject(config.params)
          ? {
              ...query,
              ...config.params
            }
          : query;
      } else {
        config = {
          params: query
        };
      }
    }

    return [APIService.resolveApiRoute(apiName, params), data, config];
  }

  // private method used to send requests
  static request(proxy, method, apiName, ...options) {
    const [url, data, config] = APIService.resolveOptions(apiName, ...options);

    // signature for get and delete:
    // axios.get(url[, config])
    // axios.delete(url[, config])
    let signatures = [url];

    // else: signature for post/put/patch
    // axios.post(url[, data[, config]])
    // axios.put(url[, data[, config]])
    // axios.patch(url[, data[, config]])
    if (["post", "put", "patch"].includes(method)) {
      signatures.push(data);
    }

    // has config
    if (config) {
      signatures.push(config);
    }

    return rawRequest(method, signatures, true, proxy);
  }
}
