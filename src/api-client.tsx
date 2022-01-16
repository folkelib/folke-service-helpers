import React, { createContext, ReactNode, useContext, useMemo } from "react";
import { AuthorizeContext, AuthorizeService } from "./authorize/authorize";

export type Data =
    | Blob
    | Int8Array
    | Int16Array
    | Int32Array
    | Uint8Array
    | Uint16Array
    | Uint32Array
    | Uint8ClampedArray
    | Float32Array
    | Float64Array
    | DataView
    | ArrayBuffer
    | FormData
    | string
    | null;

export type ApiResponse<TD> =
    | { value: TD; response: Response; ok: true }
    | { response: Response; ok: false; message: string };

export interface ApiClient {
    fetch(
        url: string,
        method: string,
        data: Data | undefined
    ): Promise<Response>;
    fetchJson<TD>(
        url: string,
        method: string,
        data: Data | undefined
    ): Promise<ApiResponse<TD>>;
}

interface ApiClientOptions {
    onQueryStart?: () => void;
    onQueryEnd?: () => void;
    userManager?: AuthorizeService;
}

export class SimpleApiClient implements ApiClient {
    constructor(private options?: ApiClientOptions) {}

    /** Fetches an url that returns one value */
    async fetchJson<TD>(
        url: string,
        method: string,
        data: Data | undefined
    ): Promise<ApiResponse<TD>> {
        const response = await this.fetch(url, method, data);
        if (response.ok) {
            const json = await response.json();
            return { ok: true, value: json as TD, response: response };
        } else {
            const text = await response.text();
            return { response: response, ok: false, message: text };
        }
    }

    /** Fetches an url that returns nothing */
    async fetch(
        url: string,
        method: string,
        data: Data | undefined
    ): Promise<Response> {
        if (this.options && this.options.onQueryStart)
            this.options.onQueryStart();

        const headers = new Headers();
        headers.append("Accept", "application/json");
        headers.append("Content-Type", "application/json");
        let credentials: RequestCredentials = "same-origin";
        if (this.options && this.options.userManager) {
            const authorizationHeader =
                await this.options.userManager.getAuthorizationHeader();
            if (authorizationHeader) {
                headers.append("Authorization", authorizationHeader);
                credentials = "omit";
            }
        }
        const requestInit: RequestInit = {
            method: method,
            credentials,
            headers: headers,
        };
        if (data != undefined) requestInit.body = data;
        return await window.fetch(url, requestInit);
    }
}

/** Creates a guery string from a list of parameters. Starts with a ? */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getQueryString(parameters?: { [key: string]: any }) {
    const parametersList: string[] = [];

    if (parameters) {
        for (const key in parameters) {
            let value = parameters[key];
            if (value == undefined) continue;
            if (value instanceof Date) value = value.toISOString();
            parametersList.push(key + "=" + encodeURIComponent(value));
        }
    }
    let ret: string;

    if (parametersList.length > 0) {
        ret = "?" + parametersList.join("&");
    } else {
        ret = "";
    }
    return ret;
}

export interface ErrorMessages {
    unauthorized: string;
    internalServerError: string;
    notFound: string;
    unknownError: string;
}

const defaultErrorMessages = {
    unauthorized: "Unauthorized access",
    internalServerError: "Internal server error",
    notFound: "Resource not found",
    unknownError: "Unknown error",
};

export async function parseErrors(
    error: Response,
    errorMessages: ErrorMessages = defaultErrorMessages
) {
    switch (error.status) {
        case 401:
            return errorMessages.unauthorized;
        case 404:
            return errorMessages.notFound;
        case 500:
            return errorMessages.internalServerError;
        default:
            return errorMessages.unknownError;
    }
}

const ApiClientContext = createContext<ApiClient>(new SimpleApiClient());

export function ApiClientProvider({ children }: { children: ReactNode }) {
    const userManager = useContext(AuthorizeContext) ?? undefined;
    const apiClient = useMemo(() => {
        return new SimpleApiClient({ userManager });
    }, [userManager]);
    return (
        <ApiClientContext.Provider value={apiClient}>
            {children}
        </ApiClientContext.Provider>
    );
}

export function useApiClient() {
    return useContext(ApiClientContext);
}
