import { observable, action, makeObservable } from "mobx";
import { LoaderOptions, LoaderResponse } from "./options";

export class MapLoader<TValue, TParameters extends unknown[]> {
    public cache = new Map<string, TValue | null>();
    private loadingParameters = new Map<string, boolean>();

    constructor(
        private loader: (
            ...parameters: TParameters
        ) => Promise<LoaderResponse<TValue>>,
        private options?: LoaderOptions<TValue>,
    ) {
        makeObservable(this, {
            cache: options?.readonly ? observable.shallow : observable,
            setValue: action,
        });
    }

    /** Call this only in a @computed or in a render() with @observer */
    getValue(...parameters: TParameters): TValue | null {
        const serialized = JSON.stringify(parameters);
        const cache = this.cache.get(serialized);


        if (this.loadingParameters)
            if (
                cache !== undefined 
            ) {
                return cache;
            }
        const loading = this.loadingParameters.get(serialized);

        if (loading) {
                return cache || null;
            
        }
        this.load(parameters, serialized);
        return null;
    }

    private async load(
        id: TParameters,
        serialized: string,
    ) {
        this.loadingParameters.set(serialized, true);
        const result = await this.loader(...id);
        if (result.ok) {
            this.setValue(result.value, serialized);
        } else {
            this.setValue(null, serialized);
        }
    }

    setValue(
        value: TValue | null,
        serialized: string,
    ) {
        this.cache.set(serialized, value);
        this.loadingParameters.set(serialized, false);
        if (this.options?.onChange && value) this.options.onChange(value);
    }

    getCached(filter?: (x: TParameters) => boolean): [TParameters, TValue][] {
        const result: [TParameters, TValue][] = Array.from(this.cache)
            .filter(([_, value]) => value !== null)
            .map(([key, value]) => [JSON.parse(key) as TParameters, value!]);
        if (filter) return result.filter(([x]) => filter(x));
        return result;
    }

    getCachedValues(): TValue[] {
        return Array.from(this.cache.values()).filter(
            (x) => x !== null,
        ) as TValue[];
    }

    updateCache(parameters: TParameters, value: TValue) {
        this.cache.set(JSON.stringify(parameters), value);
    }
}
