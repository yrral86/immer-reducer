"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports._clearKnownClasses = exports.stopAccumulatingPatches = exports.popAccumulatedPatches = exports.beginAccumulatingPatches = exports.setPrefix = exports.createReducerFunction = exports.createActionCreators = exports.ImmerReducer = exports.composeReducers = exports.isActionFrom = exports.isAction = void 0;
var immer_1 = __importStar(require("immer"));
var actionTypePrefix = "IMMER_REDUCER";
var accumulatePatches = false;
var patches = [];
/**
 * Type guard for detecting actions created by immer reducer
 *
 * @param action any redux action
 * @param immerActionCreator method from a ImmerReducer class
 */
function isAction(action, immerActionCreator) {
    return action.type === immerActionCreator.type;
}
exports.isAction = isAction;
function isActionFromClass(action, immerReducerClass) {
    if (typeof action.type !== "string") {
        return false;
    }
    if (!action.type.startsWith(actionTypePrefix + ":")) {
        return false;
    }
    var _a = removePrefix(action.type).split("#"), className = _a[0], methodName = _a[1];
    if (className !== getReducerName(immerReducerClass)) {
        return false;
    }
    if (typeof immerReducerClass.prototype[methodName] !== "function") {
        return false;
    }
    return true;
}
function isActionFrom(action, immerReducerClass) {
    return isActionFromClass(action, immerReducerClass);
}
exports.isActionFrom = isActionFrom;
/**
 * Combine multiple reducers into a single one
 *
 * @param reducers two or more reducer
 */
function composeReducers() {
    var reducers = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        reducers[_i] = arguments[_i];
    }
    return function (state, action) {
        return (reducers.reduce(function (state, subReducer) {
            if (typeof subReducer === "function") {
                return subReducer(state, action);
            }
            return state;
        }, state) || state);
    };
}
exports.composeReducers = composeReducers;
/** The actual ImmerReducer class */
var ImmerReducer = /** @class */ (function () {
    function ImmerReducer(draftState, state) {
        this.state = state;
        this.draftState = draftState;
    }
    return ImmerReducer;
}());
exports.ImmerReducer = ImmerReducer;
function removePrefix(actionType) {
    return actionType
        .split(":")
        .slice(1)
        .join(":");
}
var KNOWN_REDUCER_CLASSES = [];
var DUPLICATE_INCREMENTS = {};
/**
 * Set customName for classes automatically if there is multiple reducers
 * classes defined with the same name. This can occur accidentaly when using
 * name mangling with minifiers.
 *
 * @param immerReducerClass
 */
function setCustomNameForDuplicates(immerReducerClass) {
    var hasSetCustomName = KNOWN_REDUCER_CLASSES.find(function (klass) {
        return Boolean(klass === immerReducerClass);
    });
    if (hasSetCustomName) {
        return;
    }
    var duplicateCustomName = immerReducerClass.customName &&
        KNOWN_REDUCER_CLASSES.find(function (klass) {
            return Boolean(klass.customName &&
                klass.customName === immerReducerClass.customName);
        });
    if (duplicateCustomName) {
        throw new Error("There is already customName " + immerReducerClass.customName + " defined for " + duplicateCustomName.name);
    }
    var duplicate = KNOWN_REDUCER_CLASSES.find(function (klass) { return klass.name === immerReducerClass.name; });
    if (duplicate && !duplicate.customName) {
        var number = DUPLICATE_INCREMENTS[immerReducerClass.name];
        if (number) {
            number++;
        }
        else {
            number = 1;
        }
        DUPLICATE_INCREMENTS[immerReducerClass.name] = number;
        immerReducerClass.customName = immerReducerClass.name + "_" + number;
    }
    KNOWN_REDUCER_CLASSES.push(immerReducerClass);
}
/**
 * Convert function arguments to ImmerAction object
 */
function createImmerAction(type, args) {
    if (args.length === 1) {
        return { type: type, payload: args[0] };
    }
    return {
        type: type,
        payload: args,
        args: true,
    };
}
/**
 * Get function arguments from the ImmerAction object
 */
function getArgsFromImmerAction(action) {
    if (action.args) {
        return action.payload;
    }
    return [action.payload];
}
function getAllPropertyNames(obj) {
    var proto = Object.getPrototypeOf(obj);
    var inherited = proto ? getAllPropertyNames(proto) : [];
    return Object.getOwnPropertyNames(obj)
        .concat(inherited)
        .filter(function (propertyName, index, uniqueList) {
        return uniqueList.indexOf(propertyName) === index;
    });
}
function createActionCreators(immerReducerClass) {
    setCustomNameForDuplicates(immerReducerClass);
    var actionCreators = {};
    var immerReducerProperties = getAllPropertyNames(ImmerReducer.prototype);
    getAllPropertyNames(immerReducerClass.prototype).forEach(function (key) {
        if (immerReducerProperties.includes(key)) {
            return;
        }
        var method = immerReducerClass.prototype[key];
        if (typeof method !== "function") {
            return;
        }
        var type = actionTypePrefix + ":" + getReducerName(immerReducerClass) + "#" + key;
        var actionCreator = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            // Make sure only the arguments are passed to the action object that
            // are defined in the method
            return createImmerAction(type, args.slice(0, method.length));
        };
        actionCreator.type = type;
        actionCreators[key] = actionCreator;
    });
    return actionCreators; // typed in the function signature
}
exports.createActionCreators = createActionCreators;
function getReducerName(klass) {
    var name = klass.customName || klass.name;
    if (!name) {
        throw new Error("immer-reducer failed to get reducer name for a class. Try adding 'static customName = \"name\"'");
    }
    return name;
}
function createReducerFunction(immerReducerClass, initialState) {
    setCustomNameForDuplicates(immerReducerClass);
    return function immerReducerFunction(state, action) {
        if (state === undefined) {
            state = initialState;
        }
        if (!isActionFromClass(action, immerReducerClass)) {
            return state;
        }
        if (!state) {
            throw new Error("ImmerReducer does not support undefined state. Pass initial state to createReducerFunction() or createStore()");
        }
        var _a = removePrefix(action.type).split("#"), _ = _a[0], methodName = _a[1];
        var reducer = function (draftState) {
            var reducers = new immerReducerClass(draftState, state);
            reducers[methodName].apply(reducers, getArgsFromImmerAction(action));
            // The reducer replaced the instance with completely new state so
            // make that to be the next state
            if (reducers.draftState !== draftState) {
                return reducers.draftState;
            }
            return draftState;
            // Workaround typing changes in Immer 9.x. This does not actually
            // affect the exposed types by immer-reducer itself.
            // Also using immer internally with anys like this allow us to
            // support multiple versions of immer.
        };
        if (accumulatePatches) {
            var _b = immer_1.produceWithPatches(state, reducer), newState = _b[0], newPatches = _b[1], _1 = _b[2];
            if (immerReducerClass.patchPathPrefix) {
                newPatches.forEach(function (patch) {
                    var _a;
                    return (_a = patch.path).unshift.apply(_a, immerReducerClass.patchPathPrefix);
                });
            }
            patches.push.apply(patches, newPatches);
            return newState;
        }
        else {
            return immer_1.default(state, reducer);
        }
    };
}
exports.createReducerFunction = createReducerFunction;
function setPrefix(prefix) {
    actionTypePrefix = prefix;
}
exports.setPrefix = setPrefix;
function beginAccumulatingPatches() {
    accumulatePatches = true;
    patches = [];
}
exports.beginAccumulatingPatches = beginAccumulatingPatches;
function popAccumulatedPatches() {
    var accumulated = patches;
    patches = [];
    return accumulated;
}
exports.popAccumulatedPatches = popAccumulatedPatches;
function stopAccumulatingPatches() {
    accumulatePatches = false;
    patches = [];
}
exports.stopAccumulatingPatches = stopAccumulatingPatches;
/**
 * INTERNAL! This is only for tests!
 */
function _clearKnownClasses() {
    KNOWN_REDUCER_CLASSES = [];
}
exports._clearKnownClasses = _clearKnownClasses;
if (typeof module !== "undefined") {
    // Clear classes on Webpack Hot Module replacement as it will mess up the
    // duplicate checks appear
    (_b = (_a = module.hot) === null || _a === void 0 ? void 0 : _a.addStatusHandler) === null || _b === void 0 ? void 0 : _b.call(_a, function (status) {
        if (status === "prepare") {
            _clearKnownClasses();
        }
    });
}
//# sourceMappingURL=immer-reducer.js.map