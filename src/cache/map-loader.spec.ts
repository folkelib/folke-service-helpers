import { test, expect } from "@jest/globals";
import { when } from "mobx";
import { MapLoader } from ".";

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
