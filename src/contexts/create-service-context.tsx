import React from "react";
import { ApiClient, useApiClient } from "../api-client";

type Result<TName extends string, TService> = {
    [key in `${TName}ServiceContext`]: React.Context<TService | null>;
} & { [key in `${TName}ServiceProvider`]: React.FC } & {
    [key in `use${TName}Service`]: () => TService;
};

export function createServiceContext<TService, TName extends string>(
    constr: new (apiHelper: ApiClient) => TService,
    name: TName
): Result<TName, TService> {
    const Context = React.createContext<TService | null>(null);
    const serviceProvider: React.FC = ({
        children,
    }: {
        children?: React.ReactNode;
    }) => {
        const apiHelper = useApiClient();
        const service = React.useMemo(() => new constr(apiHelper), [apiHelper]);
        return <Context.Provider value={service}>{children}</Context.Provider>;
    };
    const useService = () => {
        const service = React.useContext(Context);
        if (service === null)
            throw Error(
                `use${name}Service must be called within ${name}ServiceProvider`
            );
        return service;
    };

    Context.displayName = `${name}ServiceContext`;
    return {
        [`${name}ServiceContext`]: Context,
        [`${name}ServiceProvider`]: serviceProvider,
        [`use${name}Service`]: useService,
    } as Result<TName, TService>;
}
