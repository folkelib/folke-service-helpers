import { test, expect } from "@jest/globals";
import { observable, runInAction, when } from "mobx";
import { LoaderResponse, MapLoader } from ".";
import { UserStore } from "../authorize";

test("getValue", async () => {
    // Arrange
    const loader = (id: number) => Promise.resolve({ ok: true, value: id + 1 });
    const serviceCache = new MapLoader(loader);

    // Act
    const result = serviceCache.getValue(15);
    expect(result).toBe(null);
    await when(() => serviceCache.getValue(15) !== null);
    expect(serviceCache.getValue(15)).toBe(16);
});

test("the identifier didn't change", async () => {
    // Arrange
    let serial = 0;
    const userManager: UserStore = observable({
        identifier: "toto",
        authorizationHeader: "",
    });

    const service = (x: number): Promise<LoaderResponse<string>> =>
        Promise.resolve({
            value: `_${x + serial++}`,
            ok: true,
        });
    const cache = new MapLoader(service, userManager);

    // Act
    const value = cache.getValue(5);

    // Assert
    expect(value).toBeNull();
    await when(() => cache.getValue(5) !== null);
    expect(cache.getValue(5)).toBe("_5");
});

test("the identifier did change", async () => {
    // Arrange
    let serial = 0;
    const userStore: UserStore = observable({
        identifier: "toto",
        authorizationHeader: null,
    });

    const service = (x: number): Promise<LoaderResponse<string>> =>
        Promise.resolve({
            value: `_${x + serial++}`,
            ok: true,
        });
    const cache = new MapLoader(service, userStore);

    // Act
    const value = cache.getValue(5);

    // Assert
    expect(value).toBeNull();
    await when(() => cache.getValue(5) !== null);
    expect(cache.getValue(5)).toBe("_5");
    runInAction(() => {
        userStore.identifier = "titi";
    });
    await when(() => cache.getValue(5) !== null);
    expect(cache.getValue(5)).toBe("_6");
});

test("the user got connected", async () => {
    // Arrange
    let serial = 0;
    const userStore: UserStore = observable({
        identifier: null,
        authorizationHeader: null,
    });

    const service = (x: number): Promise<LoaderResponse<string>> =>
        Promise.resolve({
            value: `_${x + serial++}`,
            ok: true,
        });
    const cache = new MapLoader(service, userStore);

    // Act
    const value = cache.getValue(5);

    // Assert
    expect(value).toBeNull();
    runInAction(() => {
        userStore.identifier = "titi";
    });
    await when(() => cache.getValue(5) !== null);
    expect(cache.getValue(5)).toBe("_5");
});
