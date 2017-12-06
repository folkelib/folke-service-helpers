export declare type Data = ArrayBuffer | ArrayBufferView | Blob | FormData | string | undefined;
export interface ApiClient {
    fetch(url: string, method: string, data: Data): Promise<Response>;
    fetchJson<TD>(url: string, method: string, data: Data): Promise<TD>;
}
export declare class ResponseError extends Error {
    response: Response;
    constructor(message: string);
}
export declare class SimpleApiClient implements ApiClient {
    private options;
    constructor(options?: {
        onQueryStart?: (() => void) | undefined;
        onQueryEnd?: (() => void) | undefined;
    } | undefined);
    /** Fetches an url that returns one value */
    fetchJson<TD>(url: string, method: string, data: Data): Promise<TD>;
    /** Fetches an url that returns nothing */
    fetch(url: string, method: string, data: Data): Promise<Response>;
}
/** Creates a guery string from a list of parameters. Starts with a ? */
export declare function getQueryString(parameters?: {
    [key: string]: any;
}): string;
export interface ErrorMessages {
    unauthorized: string;
    internalServerError: string;
    notFound: string;
    unknownError: string;
}
export declare function parseErrors(error: ResponseError, showError: (error: string) => void, errorMessages?: ErrorMessages): void;
