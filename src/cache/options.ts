export interface LoaderOptions<TValue> {
    readonly?: boolean;
    onChange?: (value: TValue) => void;
    allowNotIdentified?: boolean;
}

export type LoaderResponse<T> = { ok: true; value: T } | { ok: false };
