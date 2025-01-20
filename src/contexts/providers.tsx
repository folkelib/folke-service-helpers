import React, { ReactNode } from "react";

export function ProviderList({
    children,
    providers,
}: {
    children: ReactNode;
    providers: React.FunctionComponent<{ children: ReactNode }>[];
}) {
    if (providers.length === 0) {
        return <>{children}</>;
    }
    const Provider = providers[0];
    return (
        <Provider>
            <ProviderList providers={providers.slice(1)}>
                {children}
            </ProviderList>
        </Provider>
    );
}
