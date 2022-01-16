import React from "react";
import { test, expect } from "@jest/globals";
import { createServiceContext } from "./create-service-context";
import { render, screen } from "@testing-library/react";
import { ApiClient, ApiClientContext } from "../api-client";
import { Mock } from "typemoq";

class Fake {
    constructor(public apiClient: ApiClient) {}
    fakeCall() {
        return "test";
    }
}

test("constructor", () => {
    const { FakeServiceContext, FakeServiceProvider, useFakeService } =
        createServiceContext(Fake, "Fake");
    expect(FakeServiceContext).toBeTruthy();
    expect(FakeServiceProvider).toBeTruthy();
    expect(useFakeService).toBeTruthy();
});

test("service context", async () => {
    const apiClientMock = Mock.ofType<ApiClient>();
    const { FakeServiceProvider, useFakeService } = createServiceContext(
        Fake,
        "Fake"
    );

    function ServiceUser() {
        const service = useFakeService();
        const test = service.fakeCall();
        return <span>{test}</span>;
    }

    render(
        <ApiClientContext.Provider value={apiClientMock.object}>
            <FakeServiceProvider>
                <ServiceUser></ServiceUser>
            </FakeServiceProvider>
        </ApiClientContext.Provider>
    );

    expect(await screen.findAllByText("test")).toHaveLength(1);
});
