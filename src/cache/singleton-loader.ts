import { observable, action, computed, makeObservable } from "mobx";
import { LoaderOptions, LoaderResponse } from "./options";

export class SingletonLoader<TValue> {
    @observable cache: TValue | null = null;
    @observable private loaded = false;
    private loading = false;
    allowNotIdentified = false;

    constructor(
        private loader: () => Promise<LoaderResponse<TValue>>,
        private options?: LoaderOptions<TValue>,
    ) {
        makeObservable(this);
    }

    /** Call this only in a @computed or in a render() with @observer */
    getValue(): TValue | null {
        if (this.loaded) {
            return this.cache;
        }
        if (this.loading) {
            return this.cache;
        }

        this.load();
        return null;
    }

    private load() {
        this.loading = true;
        this.loader().then((x) => {
            if (!x.ok) {
                this.setValue(null);
            } else {
                this.setValue(x.value);
            }
        });
    }

    @action
    refresh() {
        if (this.loaded) this.load();
    }

    @action
    invalidate() {
        this.loaded = false;
    }

    @computed get isLoading() {
        return this.loading;
    }

    @action
    protected setValue(value: TValue | null) {
        if (this.loading) {
            this.cache = value;
            this.loading = false;
            this.loaded = true;
            if (this.options?.onChange && value) this.options.onChange(value);
        }
    }
}
