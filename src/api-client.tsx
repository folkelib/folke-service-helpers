import { observer } from "mobx-react-lite";
import React, {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from "react";
import { AuthorizeContext } from "./authorize/authorize";

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
}

export class SimpleApiClient implements ApiClient {
    public authorizationHeader: string | null = null;

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
        if (this.authorizationHeader) {
            headers.append("Authorization", this.authorizationHeader);
            credentials = "omit";
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

export const ApiClientProvider = observer(function ApiClientProvider({
    children,
}: {
    children: ReactNode;
}) {
    const userManager = useContext(AuthorizeContext);
    const [apiClient] = useState(() => new SimpleApiClient());

    const authorizationHeader = userManager
        ? userManager.authorizationHeader
        : null;
    useEffect(() => {
        apiClient.authorizationHeader = authorizationHeader;
    }, [authorizationHeader]);

    return (
        <ApiClientContext.Provider value={apiClient}>
            {children}
        </ApiClientContext.Provider>
    );
});

export function useApiClient() {
    return useContext(ApiClientContext);
}
