import { observable, action, makeObservable } from "mobx";
import { AuthorizeService } from "..";
import { ApiResponse } from "../api-client";
import { LoaderOptions, LoaderResponse } from "./options";

export interface HasId {
    id: number;
}

export class ArrayLoader<T extends HasId, TParameters> {
    private loadingParameters: string | null = null;
    @observable private loadedParameters: string | null = null;
    @observable private result: T[] | null = null;
    private authorizationHeader: string | null = null;
    cache: T[];

    constructor(
        cache: T[] | undefined,
        private loader: (
            parameters: TParameters
        ) => Promise<LoaderResponse<T[]>>,
        private userManager?: AuthorizeService,
        private options?: LoaderOptions<T>
    ) {
        makeObservable(this);
        this.cache = cache || observable([]);
        this.authorizationHeader = userManager
            ? userManager.authorizationHeader
            : null;
    }

    /** Call this only in a @computed or in a render() with @observer */
    getValue(parameters: TParameters) {
        const serialized = JSON.stringify(parameters);
        if (
            this.loadedParameters === serialized &&
            (!this.userManager ||
                this.userManager.authorizationHeader ===
                    this.authorizationHeader ||
                this.userManager.authorizationHeader === null)
        ) {
            return this.result;
        }
        if (
            this.userManager &&
            ((this.loadingParameters === serialized &&
                this.userManager.authorizationHeader ===
                    this.authorizationHeader) ||
                this.userManager.authorizationHeader === null)
        ) {
            return this.result;
        }
        if (this.loadingParameters === serialized) {
            return null;
        }
        this.loadingParameters = serialized;
        this.authorizationHeader = this.userManager
            ? this.userManager.authorizationHeader
            : null;
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
            this.options?.onChange && this.options.onChange(added);
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

export class ArrayLoaderSync<T extends HasId, TParameters> extends ArrayLoader<
    T,
    TParameters
> {
    private previousParameters: TParameters | undefined;

    constructor(
        private connection: signalR.HubConnection,
        identifier: string,
        loader: (parameters: TParameters) => Promise<ApiResponse<T[]>>,
        userStore?: AuthorizeService,
        cache?: T[],
        options?: LoaderOptions<T>
    ) {
        super(
            cache,
            async (parameters: TParameters) => {
                if (this.previousParameters)
                    this.connection.invoke(
                        "Close",
                        identifier,
                        this.previousParameters
                    );
                this.previousParameters = parameters;
                this.connection.invoke("Open", identifier, parameters);
                return loader(parameters);
            },
            userStore,
            options
        );
        this.connection.on(
            `Add${identifier}`,
            (updatedValue: T, _: TParameters) => {
                this.addValue(updatedValue);
            }
        );
        this.connection.on(
            `Update${identifier}`,
            (updatedValue: T, _: TParameters) => this.updateValue(updatedValue)
        );
        this.connection.on(
            `Delete${identifier}`,
            (deleteValue: T, _: TParameters) => this.deleteValue(deleteValue)
        );
    }
}
