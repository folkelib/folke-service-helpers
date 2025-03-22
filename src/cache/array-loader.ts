import { observable, action, makeObservable } from "mobx";
import { LoaderOptions, LoaderResponse } from "./options";

export interface HasId {
    id: number;
}

export class ArrayLoader<T extends HasId, TParameters> {
    private loadingParameters: string | null = null;
    @observable private loadedParameters: string | null = null;
    @observable private result: T[] | null = null;
    cache: T[];

    constructor(
        cache: T[] | undefined,
        private loader: (
            parameters: TParameters,
        ) => Promise<LoaderResponse<T[]>>,
        private options?: LoaderOptions<T>,
    ) {
        makeObservable(this);
        this.cache = cache || observable([]);
    }

    /** Call this only in a @computed or in a render() with @observer */
    getValue(parameters: TParameters) {
        const serialized = JSON.stringify(parameters);
        if (
            this.loadedParameters === serialized 

        ) {
            return this.result;
        }
        if (this.loadingParameters === serialized) {
            return null;
        }
        this.loadingParameters = serialized;
        this.loader(parameters).then((x) => {
            if (!x.ok) return this.result;
            this.setValues(serialized, x.value);
        });
        return this.result;
    }

    @action
    protected addValue(value: T) {
        if (!this.result) return;
        const id = value.id;
        const existing = this.cache.find((x) => x.id === id);
        if (!existing) {
            const length = this.cache.push(value);
            const added = this.cache[length - 1];
            if (this.options?.onChange) this.options.onChange(added);
            this.result.push(added);
        } else {
            Object.assign(existing, value);
            this.result.push(existing);
        }
    }

    @action
    protected updateValue(value: T) {
        const id = value.id;
        const existing = this.cache.find((x) => x.id === id);
        if (existing) {
            Object.assign(existing, value);
        } else {
        }
    }

    @action
    protected deleteValue(value: T) {
        if (!this.result) return;
        const id = value.id;
        const index = this.result.findIndex((x) => x.id === id);
        if (index >= 0) this.result.splice(index, 1);
    }

    @action
    protected setValues(serialized: string, values: T[]) {
        if (this.loadingParameters === serialized) {
            if (this.result) {
                this.result.splice(0);
            } else {
                this.result = [];
            }
            for (const value of values) {
                this.addValue(value);
            }
            this.loadedParameters = serialized;
            this.loadingParameters = null;
        }
    }
}
