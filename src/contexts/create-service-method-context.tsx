import React, { useContext } from "react";
import { AuthorizeContext, MapLoader } from "..";
import { LoaderResponse } from "../cache/options";

type KeysOfType<T, U> = {
    [K in Extract<keyof T, string>]: T[K] extends U ? K : never;
}[Extract<keyof T, string>];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PromisedValue<T extends (...args: any) => any> =
    ReturnType<T> extends Promise<LoaderResponse<infer K>> ? K : never;

type Services<
    TServiceName extends string,
    TMethodName extends string,
    TParameters extends unknown[],
    TResult
> = {
    [key in `use${TServiceName}${Capitalize<TMethodName>}Cache`]: () => MapLoader<
        TResult,
        TParameters
    >;
} & {
    [key in `${TServiceName}${Capitalize<TMethodName>}CacheContext`]: React.Context<
        MapLoader<TResult, TParameters>
    >;
} & {
    [key in `${TServiceName}${Capitalize<TMethodName>}CacheProvider`]: ({
        children,
    }: {
        children: React.ReactNode;
    }) => React.ReactElement;
};

function capitalize<T extends string>(s: T): Capitalize<T> {
    return (s.charAt(0).toUpperCase() + s.slice(1)) as Capitalize<T>;
}

export function createServiceMethodContext<
    TService,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TMethodeName extends KeysOfType<TService, (...args: any) => any>,
    TResult = PromisedValue<TService[TMethodeName]>,
    TServiceName extends string = ""
>(
    useService: () => TService,
    serviceName: TServiceName,
    method: TMethodeName
): Services<
    TServiceName,
    TMethodeName,
    Parameters<TService[TMethodeName]>,
    TResult
> {
    const ServiceMethodCacheContext = React.createContext<MapLoader<
        TResult,
        Parameters<TService[TMethodeName]>
    > | null>(null);

    const displayName = `${serviceName}${method}Context`;
    ServiceMethodCacheContext.displayName = displayName;

    const ServiceMethodCacheProvider = ({
        children,
    }: {
        children: React.ReactNode;
    }) => {
        const service = useService();
        const authorizeService = useContext(AuthorizeContext);
        const serviceMethodCache = React.useMemo(
            () =>
                new MapLoader<TResult, Parameters<TService[TMethodeName]>>(
                    service[method],
                    authorizeService ?? undefined
                ),
            [service, authorizeService]
        );

        return (
            <ServiceMethodCacheContext.Provider value={serviceMethodCache}>
                {children}
            </ServiceMethodCacheContext.Provider>
        );
    };

    const capitalized = capitalize(method);

    const useServiceMethodCache = () => {
        const result = React.useContext(ServiceMethodCacheContext);
        if (result == null)
            throw Error(
                `use${serviceName}${capitalized} must be called within ${serviceName}${capitalized}CacheProvider`
            );
        return result;
    };

    return {
        [`use${serviceName}${capitalized}Cache`]: useServiceMethodCache,
        [`${serviceName}${capitalized}CacheProvider`]:
            ServiceMethodCacheProvider,
        [`${serviceName}${capitalized}CacheContext`]: ServiceMethodCacheContext,
    } as Services<
        TServiceName,
        TMethodeName,
        Parameters<TService[TMethodeName]>,
        TResult
    >;
}
