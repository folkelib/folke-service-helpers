import { observable, action, computed } from "mobx";
import { UserManager } from "./user-manager";
import { ApiResponse } from "./api-client";

/** This class allows to load a value with a given parameter. It keep in cache only one value.
 * If you want to keep several values in cache, use MapLoader.
 */
export class LazyLoader<TValue, TParameters> {
    @observable cache: TValue | null = null;
    @observable private loadedParameters: string | null = null;
    private loadingParameters: string | null = null;
    private userToken: string | null;
    allowNotIdentified = false;

    constructor(private loader: (parameters: TParameters) => Promise<ApiResponse<TValue>>, private userManager?: UserManager, private onChange?: (value: TValue) => void) {
        this.userToken = userManager ? userManager.authorizationHeader : null;
    }

    /** Call this only in a @computed or in a render() with @observer */
    getValue(parameters: TParameters): TValue | null {
        const serialized = JSON.stringify(parameters);
        if (this.loadedParameters === serialized && (this.userManager === undefined || this.userManager.authorizationHeader === this.userToken || this.userManager.authorizationHeader === null)) {
            return this.cache;
        }
        if ((this.loadingParameters === serialized && (this.userManager === undefined || this.userManager.authorizationHeader === this.userToken) || (this.userManager !== undefined && this.userManager.authorizationHeader === null && !this.allowNotIdentified))) {
            return this.cache;            
        }
        
        this.load(parameters, serialized);
        return null;
    }

    private load(id: TParameters, serialized: string) {
        if (this.userManager) this.userToken = this.userManager.authorizationHeader;
        this.loadingParameters = serialized;
        this.loader(id).then(x => {
            if (!x.ok) {
                this.setValue(null, serialized);
            } else {
                this.setValue(x.value, serialized);
            }
        });
    }

    @action
    refresh() {
        if (this.loadedParameters) this.load(JSON.parse(this.loadedParameters) as TParameters, this.loadedParameters);
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
            if (this.onChange && value) this.onChange(value);
        }
    }
}

export class LazyLoaderSync<TValue, TParameters> extends LazyLoader<TValue, TParameters> {
    private previousParameters: TParameters | undefined;

    constructor(
        private connection: signalR.HubConnection, 
        identifier: string,
        loader: (parameters: TParameters) => Promise<ApiResponse<TValue>>, 
        userManager?: UserManager, 
        onChange?: (value: TValue) => void) {
        super(async (parameters: TParameters) =>  {
            if (this.previousParameters) this.connection.invoke(`Close${identifier}`, this.previousParameters);
            this.previousParameters = parameters;
            this.connection.invoke(`Open${identifier}`, parameters);
            return loader(parameters);
        }, userManager, onChange);
        this.connection.on(`Update${identifier}`, (updatedValue: TValue, p: TParameters) => this.setValue(updatedValue, JSON.stringify(p)));
        this.connection.on(`Delete${identifier}`, (p: TParameters) => this.setValue(null, JSON.stringify(p)));
    }
}