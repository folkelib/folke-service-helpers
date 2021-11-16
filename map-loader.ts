import { observable, action } from "mobx";
import { AuthorizeService } from "./authorize/authorize";

export class MapLoader<TValue, TParameters> {
    @observable protected cache = new Map<string, TValue | null>();
    private loadingParameters = new Map<string, boolean>();
    private authorizationHeader?: string | null;

    constructor(
        private loader: (
            parameters: TParameters
        ) => Promise<{ value: TValue; status: number }>,
        private userManager?: AuthorizeService,
        private onChange?: (value: TValue) => void
    ) {
        if (userManager)
            this.authorizationHeader = userManager.authorizationHeader;
    }

    /** Call this only in a @computed or in a render() with @observer */
    getValue(parameters: TParameters): TValue | null {
        const serialized = JSON.stringify(parameters);
        const cache = this.cache.get(serialized);
        if (
            cache &&
            (this.userManager === undefined ||
                this.userManager.authorizationHeader ===
                    this.authorizationHeader ||
                this.userManager.authorizationHeader === null)
        ) {
            return cache;
        }
        if (this.loadingParameters.get(serialized)) return cache || null;
        this.load(parameters, serialized);
        return null;
    }

    private load(id: TParameters, serialized: string) {
        if (this.userManager)
            this.authorizationHeader = this.userManager.authorizationHeader;
        this.loadingParameters.set(serialized, true);
        this.loader(id).then(({ value, status }) => {
            if (status >= 400) {
                this.setValue(null, serialized);
            } else {
                this.setValue(value, serialized);
            }
        });
    }

    @action
    protected setValue(value: TValue | null, serialized: string) {
        this.cache.set(serialized, value);
        this.loadingParameters.set(serialized, false);
        if (this.onChange && value) this.onChange(value);
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
