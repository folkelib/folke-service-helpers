import React from "react";
import { Route, Routes } from "react-router";
import { Login } from "./login";
import Logout from "./logout";
import { LoginActions, LogoutActions } from "./authorize";

function ApiAuthorizationRoutes() {
    return (
        <Routes>
            <Route path="/">
                <Route
                    path={LoginActions.Login}
                    element={<Login loginAction="login" />}
                />
                <Route
                    path={LoginActions.LoginFailed}
                    element={<Login loginAction="login-failed" />}
                />
                <Route
                    path={LoginActions.LoginCallback}
                    element={<Login loginAction="login-callback" />}
                />
                <Route
                    path={LoginActions.Profile}
                    element={<Login loginAction="profile" />}
                />
                <Route
                    path={LoginActions.Register}
                    element={<Login loginAction="register" />}
                />
                <Route
                    path={LogoutActions.LogOut}
                    element={<Logout action="logout" />}
                />
                <Route
                    path={LogoutActions.LogOutCallback}
                    element={<Logout action="logout-callback" />}
                />
                <Route
                    path={LogoutActions.FrontChannelLogout}
                    element={
                        <Logout action={LogoutActions.FrontChannelLogout} />
                    }
                />
            </Route>
        </Routes>
    );
}

export default ApiAuthorizationRoutes;
