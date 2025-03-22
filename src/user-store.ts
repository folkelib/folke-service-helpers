import { createContext } from "react";

export interface UserStore {
    identifier: string | null;
    authorizationHeader: string | null;
}

export const UserStoreContext = createContext<UserStore | null>(null);