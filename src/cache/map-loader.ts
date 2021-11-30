import { observable, action, makeObservable } from "mobx";
import { AuthorizeService } from "../authorize";
import { LoaderOptions, LoaderResponse } from "./options";

export class MapLoader<TValue, TParameters extends unknown[]> {
    public cache = new Map<string, TValue | null>();
    private loadingParameters = new Map<string, boolean>();
    public userIdentifier?: string | null;

    constructor(
        private loader: (
            ...parameters: TParameters
        ) => Promise<LoaderResponse<TValue>>,
        private userManager?: AuthorizeService,
        private options?: LoaderOptions<TValue>
    ) {
        this.userIdentifier = userManager?.identifier;
        makeObservable(this, {
            userIdentifier: observable,
            cache: options?.readonly ? observable.shallow : observable,
            setValue: action,
        });
    }

    /** Call this only in a @computed or in a render() with @observer */
    getValue(...parameters: TParameters): TValue | null {
        const serialized = JSON.stringify(parameters);
        const cache = this.cache.get(serialized);
        const userManager = this.userManager;
        const newIdentifier = userManager?.identifier;

        if (
            userManager &&
            !newIdentifier &&
            !this.options?.allowNotIdentified
        ) {
            return null;
        }

        if (this.loadingParameters)
            if (
                cache !== undefined &&
                (this.userManager === undefined ||
                    newIdentifier === this.userIdentifier ||
                    newIdentifier === null)
            ) {
                return cache;
            }
        const loading = this.loadingParameters.get(serialized);

        if (loading) {
            if (
                userManager === undefined ||
                newIdentifier === this.userIdentifier ||
                (userManager !== undefined && newIdentifier === null)
            ) {
                return cache || null;
            } else {
                return null;
            }
        }
        this.load(parameters, serialized, newIdentifier);
        return null;
    }

    private async load(
        id: TParameters,
        serialized: string,
        newIdentifier: string | null | undefined
    ) {
        this.loadingParameters.set(serialized, true);
        const result = await this.loader(...id);
        if (result.ok) {
            this.setValue(result.value, serialized, newIdentifier);
        } else {
            this.setValue(null, serialized, newIdentifier);
        }
    }

    setValue(
        value: TValue | null,
        serialized: string,
        newIdentifier: string | null | undefined
    ) {
        this.cache.set(serialized, value);
        this.userIdentifier = newIdentifier;
        this.loadingParameters.set(serialized, false);
        if (this.options?.onChange && value) this.options.onChange(value);
    }

    getCached(filter?: (x: TParameters) => boolean): [TParameters, TValue][] {
        const result: [TParameters, TValue][] = Array.from(this.cache)
            .filter(([_, value]) => value !== null)
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            .map(([key, value]) => [JSON.parse(key) as TParameters, value!]);
        if (filter) return result.filter(([x]) => filter(x));
        return result;
    }

    getCachedValues(): TValue[] {
        return Array.from(this.cache.values()).filter(
            (x) => x !== null
        ) as TValue[];
    }

    updateCache(parameters: TParameters, value: TValue) {
        this.cache.set(JSON.stringify(parameters), value);
    }
}
