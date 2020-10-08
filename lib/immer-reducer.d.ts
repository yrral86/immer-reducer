import { Draft, Patch } from "immer";
/** get function arguments as tuple type */
declare type ArgumentsType<T> = T extends (...args: infer V) => any ? V : never;
/**
 * Get the first value of tuple when the tuple length is 1 otherwise return the
 * whole tuple
 */
declare type FirstOrAll<T> = T extends [infer V] ? V : T;
/** Get union of function property names */
declare type FunctionPropertyNames<T> = {
    [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];
declare type MethodObject = {
    [key: string]: () => any;
};
/** Pick only methods from object */
declare type Methods<T> = Pick<T, FunctionPropertyNames<T>>;
/** flatten functions in an object to their return values */
declare type FlattenToReturnTypes<T extends MethodObject> = {
    [K in keyof T]: ReturnType<T[K]>;
};
/** get union of object value types */
declare type ObjectValueTypes<T> = T[keyof T];
/** get union of object method return types */
declare type ReturnTypeUnion<T extends MethodObject> = ObjectValueTypes<FlattenToReturnTypes<T>>;
/**
 * Get union of actions types from a ImmerReducer class
 */
export declare type Actions<T extends ImmerReducerClass<T>> = ReturnTypeUnion<ActionCreators<T>>;
/** type constraint for the ImmerReducer class  */
export interface ImmerReducerClass<T> {
    customName?: string;
    patchPathPrefix?: string[];
    new (...args: any[]): ImmerReducer<T>;
}
/** get state type from a ImmerReducer subclass */
export declare type ImmerReducerState<T> = T extends {
    prototype: {
        state: infer V;
    };
} ? V : never;
/** generate reducer function type from the ImmerReducer class */
export interface ImmerReducerFunction<T extends ImmerReducerClass<any>> {
    (state: ImmerReducerState<T> | undefined, action: ReturnTypeUnion<ActionCreators<T>>): ImmerReducerState<T>;
}
/** ActionCreator function interface with actual action type name */
interface ImmerActionCreator<ActionTypeType, Payload extends any[]> {
    readonly type: ActionTypeType;
    (...args: Payload): {
        type: ActionTypeType;
        payload: FirstOrAll<Payload>;
    };
}
/** generate ActionCreators types from the ImmerReducer class */
export declare type ActionCreators<ClassActions extends ImmerReducerClass<any>> = {
    [K in keyof Methods<InstanceType<ClassActions>>]: ImmerActionCreator<K, ArgumentsType<InstanceType<ClassActions>[K]>>;
};
/**
 * Type guard for detecting actions created by immer reducer
 *
 * @param action any redux action
 * @param immerActionCreator method from a ImmerReducer class
 */
export declare function isAction<A extends ImmerActionCreator<any, any>>(action: {
    type: any;
}, immerActionCreator: A): action is ReturnType<A>;
export declare function isActionFrom<T extends ImmerReducerClass<any>>(action: {
    type: any;
}, immerReducerClass: T): action is Actions<T>;
interface Reducer<State> {
    (state: State | undefined, action: any): State;
}
/**
 * Combine multiple reducers into a single one
 *
 * @param reducers two or more reducer
 */
export declare function composeReducers<State>(...reducers: (Reducer<State | undefined>)[]): Reducer<State>;
/** The actual ImmerReducer class */
export declare class ImmerReducer<T> {
    static customName?: string;
    static patchPathPrefix?: string[];
    readonly state: T;
    draftState: Draft<T>;
    constructor(draftState: Draft<T>, state: T);
}
export declare function createActionCreators<T extends ImmerReducerClass<any>>(immerReducerClass: T): ActionCreators<T>;
export declare function createReducerFunction<T extends ImmerReducerClass<any>>(immerReducerClass: T, initialState?: ImmerReducerState<T>): ImmerReducerFunction<T>;
export declare function setPrefix(prefix: string): void;
export declare function beginAccumulatingPatches(): void;
export declare function popAccumulatedPatches(): Patch[];
export declare function stopAccumulatingPatches(): void;
/**
 * INTERNAL! This is only for tests!
 */
export declare function _clearKnownClasses(): void;
export {};
