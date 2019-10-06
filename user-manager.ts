export interface UserManager {
    authorizationHeader: string | null;

    getAuthorizationHeader(): Promise<string>;
}