import React from "react";
import { test, expect } from "@jest/globals";
import { createServiceMethodContext } from "./create-service-method-context";
import { render, screen } from "@testing-library/react";
import { observer } from "mobx-react-lite";

test("call without mapper", () => {
    class FakeService {
        get(id: number) {
            return Promise.resolve({ ok: true, value: id + 3 });
        }
    }
    const fakeService = new FakeService();
    const { FakeGetCacheContext, FakeGetCacheProvider, useFakeGetCache } =
        createServiceMethodContext(() => fakeService, "Fake", "get");
    expect(FakeGetCacheContext).toBeTruthy();
    expect(FakeGetCacheProvider).toBeTruthy();
    expect(useFakeGetCache).toBeTruthy();
});

test("method cache", async () => {
    class FakeService {
        get(id: number) {
            return Promise.resolve({ ok: true, value: id + 3 });
        }
    }
    const fakeService = new FakeService();
    const { useFakeGetCache, FakeGetCacheProvider } =
        createServiceMethodContext(() => fakeService, "Fake", "get");

    const ServiceUser = observer(function ServiceUser() {
        const service = useFakeGetCache();
        const test = service.getValue(12);
        return <span data-testid="test">{test}</span>;
    });

    render(
        <FakeGetCacheProvider>
            <ServiceUser></ServiceUser>
        </FakeGetCacheProvider>
    );

    const value = await screen.findByTestId("test");
    expect(value.innerHTML).toBe("15");
});
