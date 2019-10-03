export declare type Data = Blob | Int8Array | Int16Array | Int32Array | Uint8Array | Uint16Array | Uint32Array | Uint8ClampedArray | Float32Array | Float64Array | DataView | ArrayBuffer | FormData | string | null;
export declare type ApiResponse<TD> = {
    value: TD;
    response: Response;
    ok: true;
} | {
    response: Response;
    ok: false;
    message: string;
};
export interface ApiClient {
    fetch(url: string, method: string, data: Data | undefined): Promise<Response>;
    fetchJson<TD>(url: string, method: string, data: Data | undefined): Promise<ApiResponse<TD>>;
}
export declare class SimpleApiClient implements ApiClient {
    private options?;
    constructor(options?: {
        onQueryStart?: (() => void) | undefined;
        onQueryEnd?: (() => void) | undefined;
    } | undefined);
    /** Fetches an url that returns one value */
    fetchJson<TD>(url: string, method: string, data: Data | undefined): Promise<ApiResponse<TD>>;
    /** Fetches an url that returns nothing */
    fetch(url: string, method: string, data: Data | undefined): Promise<Response>;
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
export declare function parseErrors(error: Response, errorMessages?: ErrorMessages): Promise<string>;
