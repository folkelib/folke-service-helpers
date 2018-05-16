export type Data = Blob | Int8Array | Int16Array | Int32Array | Uint8Array | Uint16Array | Uint32Array | Uint8ClampedArray | Float32Array | Float64Array | DataView | ArrayBuffer | FormData | string | null;

export interface ApiClient {
    fetch(url: string, method: string, data: Data): Promise<Response>;
    fetchJson<TD>(url: string, method: string, data: Data): Promise<TD>;
}

export class ResponseError extends Error {
    response?: Response;
    constructor(message:string) {
        super(message);
    }
}

export class SimpleApiClient implements ApiClient {
    constructor(private options?: { onQueryStart?: () => void, onQueryEnd?: () => void }) {}

    /** Fetches an url that returns one value */
    fetchJson<TD>(url: string, method: string, data: Data | undefined) {
        return this.fetch(url, method, data).then(response => <Promise<TD>>response.json());
    }

    /** Fetches an url that returns nothing */
    fetch(url: string, method: string, data: Data | undefined): Promise<Response> {
        if (this.options && this.options.onQueryStart) this.options.onQueryStart();

        const headers = new Headers();
        headers.append("Accept", "application/json");
        headers.append('Content-Type', 'application/json');
        var requestInit: RequestInit = {
            method: method,
            credentials: 'same-origin',
            headers: headers
        };
        if (data != undefined) requestInit.body = data;
        return window.fetch(url, requestInit).then(response => {
            if (this.options && this.options.onQueryEnd) this.options.onQueryEnd();
            if (response.status >= 300 || response.status < 200) {
                var error = new ResponseError(response.statusText);
                error.response = response;
                throw error;
            }
            return response;
        });
    }
}


/** Creates a guery string from a list of parameters. Starts with a ? */
export function getQueryString(parameters?: { [key: string]: any }) {
    var parametersList:string[] = [];

    if (parameters) {
        for (var key in parameters) {
            var value = parameters[key];
            if (value == undefined) continue;
            if (value instanceof Date)
                value = value.toISOString();
            parametersList.push(key + '=' + encodeURIComponent(value));
        }
    }
    var ret: string;

    if (parametersList.length > 0) {
        ret = '?' + parametersList.join('&');
    }
    else {
        ret = '';
    }
    return ret;
}

export interface ErrorMessages {
    unauthorized: string,
    internalServerError: string,
    notFound: string,
    unknownError: string
}

const defaultErrorMessages = {
    unauthorized: "Unauthorized access",
    internalServerError: "Internal server error",
    notFound: "Resource not found",
    unknownError: "Unknown error"
}

export function parseErrors(error:ResponseError, showError: (error: string) => void, errorMessages: ErrorMessages = defaultErrorMessages) {
    if (!error.response) {
        showError(errorMessages.unknownError);
        return;
    }

    switch (error.response.status) {
        case 401:
            showError(errorMessages.unauthorized);
            break;
        case 404:
            showError(errorMessages.notFound);
            break;
        case 500:
            showError(errorMessages.internalServerError);
            break;
        default:
            if (!error.response.json) {
                showError(errorMessages.unknownError);
            }
            else {
                error.response.json().then((value:string) => {
                    showError(value);
                });
            }
            break;
    }
}