import {
    UserManager,
    WebStorageStateStore,
    User,
    UserManagerSettings,
} from "oidc-client";
import { action, computed, makeObservable, observable } from "mobx";
import React, { createContext, ReactNode, useContext, useMemo } from "react";

export const QueryParameterNames = {
    ReturnUrl: "returnUrl",
    Message: "message",
};

export type LogoutAction =
    | "logout-callback"
    | "logout"
    | "front-channel-logged-out";

export const LogoutActions: Record<string, LogoutAction> = {
    LogoutCallback: "logout-callback",
    Logout: "logout",
    FrontChannelLogout: "front-channel-logged-out",
};

export const LoginActions = {
    Login: "login",
    LoginCallback: "login-callback",
    LoginFailed: "login-failed",
    Profile: "profile",
    Register: "register",
};

export type LoginAction =
    | "login"
    | "login-callback"
    | "login-failed"
    | "profile"
    | "register";

export interface AccessToken {
    nbf?: number;
    exp?: number;
    iss?: string;
    aud?: string;
    client_id?: string;
    sub?: string;
    auth_time?: number;
    idp?: string;
    scope?: string[];
    amr?: string[];
}

const prefix = "/authentication";

export interface ApplicationPaths {
    defaultLoginRedirectPath: string;
    apiAuthorizationClientConfigurationUrl: string;
    apiAuthorizationPrefix: string;
    login: string;
    loginFailed: string;
    loginCallback: string;
    register: string;
    profile: string;
    logOut: string;
    loggedOut: string;
    frontChannelLogout: string;
    logOutCallback: string;
    identityRegisterPath: string;
    identityManagePath: string;
}

export interface SigninState {
    returnUrl: string;
}

type CallbackFunction = () => void;

interface Callback {
    callback: CallbackFunction;
    subscription: number;
}

type NotReadonly<T> = {
    -readonly [P in keyof T]: T[P];
};

export type ReturnStatus =
    | { status: "fail"; message: string }
    | { status: "success"; state: SigninState }
    | { status: "redirect" };

export interface UserStore {
    identifier: string | null;
    authorizationHeader: string | null;
}

export class AuthorizeService implements UserStore {
    _callbacks: Callback[] = [];
    _nextSubscriptionId = 0;
    public user: User | null = null;
    public authenticated = false;
    public ready = false;
    userManager?: UserManager;

    // By default pop ups are disabled because they don't work properly on Edge.
    // If you want to enable pop up authentication simply set this flag to false.
    _popUpDisabled = true;
    applicationPaths: ApplicationPaths;

    constructor(private applicationName: string) {
        makeObservable(this, {
            user: observable,
            authenticated: observable,
            ready: observable,
            identifier: computed,
            accessToken: computed,
            updateState: action,
            authorizationHeader: computed,
        });
        this.applicationPaths = {
            defaultLoginRedirectPath: "/",
            apiAuthorizationClientConfigurationUrl: `/_configuration/${applicationName}`,
            apiAuthorizationPrefix: prefix,
            login: `${prefix}/${LoginActions.Login}`,
            loginFailed: `${prefix}/${LoginActions.LoginFailed}`,
            loginCallback: `${prefix}/${LoginActions.LoginCallback}`,
            register: `${prefix}/${LoginActions.Register}`,
            profile: `${prefix}/${LoginActions.Profile}`,
            logOut: `${prefix}/${LogoutActions.Logout}`,
            loggedOut: "/account/logout",
            frontChannelLogout: `${prefix}/${LogoutActions.FrontChannelLogout}`,
            logOutCallback: `${prefix}/${LogoutActions.LogoutCallback}`,
            identityRegisterPath: "/Identity/Account/Register",
            identityManagePath: "/Identity/Account/Manage",
        };
        this.getUser();
    }

    private async getUser() {
        if (this.user) return this.user;
        const userManager = await this.ensureUserManagerInitialized();
        this.updateState(await userManager.getUser());
        return this.user;
    }

    get authorizationHeader() {
        return (
            this.user &&
            this.user.access_token &&
            `Bearer ${this.user.access_token}`
        );
    }

    async getAuthorizationHeader() {
        await this.getUser();
        return this.authorizationHeader;
    }

    async getAccessToken() {
        const user = await this.getUser();
        return user && user.access_token;
    }

    get serializedAccessToken() {
        return this.user && this.user.access_token;
    }

    get accessToken() {
        const serializedAccessToken = this.serializedAccessToken;
        if (!serializedAccessToken) return undefined;
        const [, payload] = serializedAccessToken.split(".");
        return JSON.parse(atob(payload)) as AccessToken;
    }

    get identifier() {
        return this.accessToken?.sub ?? null;
    }

    // We try to authenticate the user in three different ways:
    // 1) We try to see if we can authenticate the user silently. This happens
    //    when the user is already logged in on the IdP and is done using a hidden iframe
    //    on the client.
    // 2) We try to authenticate the user using a PopUp Window. This might fail if there is a
    //    Pop-Up blocker or the user has disabled PopUps.
    // 3) If the two methods above fail, we redirect the browser to the IdP to perform a traditional
    //    redirect flow.
    async signIn(state: SigninState) {
        const userManager = await this.ensureUserManagerInitialized();
        try {
            const silentUser = await userManager.signinSilent(
                this.createArguments()
            );
            this.updateState(silentUser);
            return this.success(state);
        } catch (silentError) {
            // User might not be authenticated, fallback to popup authentication
            console.log("Silent authentication error: ", silentError);

            try {
                if (this._popUpDisabled) {
                    throw new Error(
                        "Popup disabled. Change 'AuthorizeService.js:AuthorizeService._popupDisabled' to false to enable it."
                    );
                }

                const popUpUser = await userManager.signinPopup(
                    this.createArguments()
                );
                this.updateState(popUpUser);
                return this.success(state);
            } catch (popUpError) {
                if (
                    popUpError instanceof Error &&
                    popUpError.message === "Popup window closed"
                ) {
                    // The user explicitly cancelled the login action by closing an opened popup.
                    return this.error("The user closed the window.");
                } else if (!this._popUpDisabled) {
                    console.log("Popup authentication error: ", popUpError);
                }

                // PopUps might be blocked by the user, fallback to redirect
                try {
                    await userManager.signinRedirect(
                        this.createArguments(state)
                    );
                    return this.redirect();
                } catch (redirectError) {
                    console.log(
                        "Redirect authentication error: ",
                        redirectError
                    );
                    return this.error(
                        redirectError instanceof Error
                            ? redirectError.toString()
                            : ""
                    );
                }
            }
        }
    }

    async completeSignIn(url: string) {
        try {
            const userManager = await this.ensureUserManagerInitialized();
            const user = await userManager.signinCallback(url);
            this.updateState(user);
            return this.success(user && user.state);
        } catch (error) {
            console.log("There was an error signing in: ", error);
            return this.error("There was an error signing in.");
        }
    }

    // We try to sign out the user in two different ways:
    // 1) We try to do a sign-out using a PopUp Window. This might fail if there is a
    //    Pop-Up blocker or the user has disabled PopUps.
    // 2) If the method above fails, we redirect the browser to the IdP to perform a traditional
    //    post logout redirect flow.
    async signOut(state: SigninState) {
        const userManager = await this.ensureUserManagerInitialized();
        try {
            if (this._popUpDisabled) {
                throw new Error(
                    "Popup disabled. Change 'AuthorizeService.js:AuthorizeService._popupDisabled' to false to enable it."
                );
            }

            await userManager.signoutPopup(this.createArguments());
            this.updateState(null);
            return this.success(state);
        } catch (popupSignOutError) {
            console.log("Popup signout error: ", popupSignOutError);
            try {
                await userManager.signoutRedirect(this.createArguments(state));
                return this.redirect();
            } catch (redirectSignOutError) {
                console.log("Redirect signout error: ", redirectSignOutError);
                return typeof redirectSignOutError === "string"
                    ? this.error(redirectSignOutError)
                    : this.error("");
            }
        }
    }

    async completeSignOut(url?: string) {
        const userManager = await this.ensureUserManagerInitialized();
        try {
            const response = await userManager.signoutCallback(url);
            this.updateState(null);
            return this.success(response && response.state);
        } catch (error) {
            console.log(`There was an error trying to log out '${error}'.`);
            return this.error(
                error && typeof error === "object" ? error.toString() : ""
            );
        }
    }

    updateState(user: User | null | undefined) {
        this.ready = true;
        if (
            (user && this.user !== null) ||
            (user &&
                (this.user === null || this.user.id_token !== user.id_token))
        ) {
            this.user = user;
            this.authenticated =
                (this.user &&
                    this.user.expires_in &&
                    this.user.expires_in > 0) ||
                false;
        }
    }

    private createArguments(state?: SigninState) {
        return { useReplaceToNavigate: true, data: state };
    }

    private error(message: string): ReturnStatus {
        return { status: "fail", message };
    }

    success(state: SigninState): ReturnStatus {
        return { status: "success", state };
    }

    redirect(): ReturnStatus {
        return { status: "redirect" };
    }

    private async ensureUserManagerInitialized() {
        if (this.userManager !== undefined) {
            return this.userManager;
        }

        const response = await fetch(
            this.applicationPaths.apiAuthorizationClientConfigurationUrl
        );
        if (!response.ok) {
            throw new Error(
                `Could not load settings for '${this.applicationName}'`
            );
        }

        const settings: NotReadonly<UserManagerSettings> =
            await response.json();
        const userSettings = { ...settings };

        userSettings.automaticSilentRenew = true;
        userSettings.includeIdTokenInSilentRenew = true;
        userSettings.loadUserInfo = true;
        userSettings.userStore = new WebStorageStateStore({
            prefix: this.applicationName,
        });

        const userManager = (this.userManager = new UserManager(userSettings));

        this.userManager.events.addUserLoaded(async (user) => {
            this.updateState(user);
        });
        this.userManager.events.addUserSignedOut(async () => {
            await userManager.removeUser();
            this.updateState(null);
        });
        return this.userManager;
    }
}

export type AuthenticationResultStatus = ReturnStatus["status"];

export const AuthorizeContext = createContext<AuthorizeService | null>(null);

export function useAuthorize() {
    const result = useContext(AuthorizeContext);
    if (result === null) {
        throw new Error(
            "Authorize service has not been initialized. Call 'useAuthorize' inside of an AuthorizeProvider."
        );
    }
    return result;
}

export function AuthorizeProvider({
    applicationName,
    children,
}: {
    applicationName: string;
    children: ReactNode;
}) {
    const authorizeService = useMemo(
        () => new AuthorizeService(applicationName),
        []
    );
    return (
        <AuthorizeContext.Provider value={authorizeService}>
            {children}
        </AuthorizeContext.Provider>
    );
}
