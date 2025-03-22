import { observable, action, computed, makeObservable } from "mobx";
import { LoaderOptions, LoaderResponse } from "./options";

/** This class allows to load a value with a given parameter. It keep in cache only one value.
 * If you want to keep several values in cache, use MapLoader.
 */
export class ValueLoader<TValue, TParameters extends unknown[]> {
    @observable cache: TValue | null = null;
    @observable private loadedParameters: string | null = null;
    private loadingParameters: string | null = null;
    allowNotIdentified = false;

    constructor(
        private loader: (
            ...parameters: TParameters
        ) => Promise<LoaderResponse<TValue>>,
        private options?: LoaderOptions<TValue>,
    ) {
        makeObservable(this);
    }

    /** Call this only in a @computed or in a render() with @observer */
    getValue(...parameters: TParameters): TValue | null {
        const serialized = JSON.stringify(parameters);
        if (this.loadedParameters === serialized) {
            return this.cache;
        }
        if (this.loadingParameters === serialized) {
            return this.cache;
        }

        this.load(parameters, serialized);
        return null;
    }

    private load(id: TParameters, serialized: string) {
        this.loadingParameters = serialized;
        this.loader(...id).then((x) => {
            if (!x.ok) {
                this.setValue(null, serialized);
            } else {
                this.setValue(x.value, serialized);
            }
        });
    }

    @action
    refresh() {
        if (this.loadedParameters)
            this.load(
                JSON.parse(this.loadedParameters) as TParameters,
                this.loadedParameters,
            );
    }

    @action
    invalidate() {
        this.loadedParameters = null;
    }

    @computed get isLoading() {
        return this.loadingParameters !== null;
    }

    @action
    protected setValue(value: TValue | null, serialized: string) {
        if (this.loadingParameters === serialized) {
            this.cache = value;
            this.loadingParameters = null;
            this.loadedParameters = value ? serialized : null;
            if (this.options?.onChange && value) this.options.onChange(value);
        }
    }
}
