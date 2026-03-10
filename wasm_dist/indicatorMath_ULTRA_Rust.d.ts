/* tslint:disable */
/* eslint-disable */

export class GpuAnalysisManager {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Dispatch thousands of OHLC history computations straight to graphic cards!
     */
    dispatch_compute(prices: Float32Array): Promise<Float32Array>;
    /**
     * Asynchronous builder for GpuAnalysisManager
     */
    static initialize(): Promise<GpuAnalysisManager>;
}

export class WasmAnalysisGenerator {
    free(): void;
    [Symbol.dispose](): void;
    append_tick(price: number, time: bigint): any;
    initialize(history_json: string): void;
    constructor(options_json: string);
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_wasmanalysisgenerator_free: (a: number, b: number) => void;
    readonly wasmanalysisgenerator_new: (a: number, b: number) => [number, number, number];
    readonly wasmanalysisgenerator_initialize: (a: number, b: number, c: number) => [number, number];
    readonly wasmanalysisgenerator_append_tick: (a: number, b: number, c: bigint) => [number, number, number];
    readonly __wbg_gpuanalysismanager_free: (a: number, b: number) => void;
    readonly gpuanalysismanager_initialize: () => any;
    readonly gpuanalysismanager_dispatch_compute: (a: number, b: any) => any;
    readonly wasm_bindgen__closure__destroy__h3bf366df1d79677e: (a: number, b: number) => void;
    readonly wasm_bindgen__closure__destroy__h79716379af6b2fb6: (a: number, b: number) => void;
    readonly wasm_bindgen__convert__closures_____invoke__h923665ad007a5b37: (a: number, b: number, c: any, d: any) => void;
    readonly wasm_bindgen__convert__closures_____invoke__h264497111314b787: (a: number, b: number, c: any) => void;
    readonly wasm_bindgen__convert__closures_____invoke__h1e0a1d5367bf3132: (a: number, b: number, c: any) => void;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
