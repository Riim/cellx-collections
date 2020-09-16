import { EventEmitter } from 'cellx';
const hasOwn = Object.prototype.hasOwnProperty;
export class ObservableMap extends EventEmitter {
    constructor(entries, options) {
        super();
        this._entries = new Map();
        if (options && options.valueEquals) {
            this._valueEquals = options.valueEquals;
        }
        if (entries) {
            let mapEntries = this._entries;
            if (entries instanceof Map || entries instanceof ObservableMap) {
                for (let [key, value] of entries instanceof Map ? entries : entries._entries) {
                    mapEntries.set(key, value);
                }
            }
            else if (Array.isArray(entries)) {
                for (let i = 0, l = entries.length; i < l; i++) {
                    mapEntries.set(entries[i][0], entries[i][1]);
                }
            }
            else {
                for (let key in entries) {
                    if (hasOwn.call(entries, key)) {
                        mapEntries.set(key, entries[key]);
                    }
                }
            }
        }
    }
    get size() {
        return this._entries.size;
    }
    get valueEquals() {
        return this._valueEquals;
    }
    onChange(listener, context) {
        return this.on(ObservableMap.EVENT_CHANGE, listener, context);
    }
    offChange(listener, context) {
        return this.off(ObservableMap.EVENT_CHANGE, listener, context);
    }
    has(key) {
        return this._entries.has(key);
    }
    get(key) {
        return this._entries.get(key);
    }
    set(key, value) {
        let entries = this._entries;
        let hasKey = entries.has(key);
        let prev;
        if (hasKey) {
            prev = entries.get(key);
            if (Object.is(value, prev)) {
                return this;
            }
        }
        entries.set(key, value);
        this.emit(ObservableMap.EVENT_CHANGE, {
            subtype: hasKey ? 'update' : 'add',
            key,
            prevValue: prev,
            value
        });
        return this;
    }
    delete(key) {
        let entries = this._entries;
        if (entries.has(key)) {
            let value = entries.get(key);
            entries.delete(key);
            this.emit(ObservableMap.EVENT_CHANGE, {
                subtype: 'delete',
                key,
                value
            });
            return true;
        }
        return false;
    }
    clear() {
        if (this._entries.size) {
            this._entries.clear();
            this.emit(ObservableMap.EVENT_CHANGE, { subtype: 'clear' });
        }
        return this;
    }
    equals(that) {
        if (!(that instanceof ObservableMap)) {
            return false;
        }
        if (this.size != that.size) {
            return false;
        }
        for (let [key, value] of this) {
            if (!that.has(key)) {
                return false;
            }
            let thatValue = that.get(key);
            if (this._valueEquals || that._valueEquals
                ? !(this._valueEquals || that._valueEquals)(value, thatValue)
                : value !== thatValue &&
                    !(value &&
                        typeof value == 'object' &&
                        value.equals &&
                        value.equals(thatValue))) {
                return false;
            }
        }
        return true;
    }
    forEach(cb, context) {
        for (let [key, value] of this._entries) {
            cb.call(context, value, key, this);
        }
    }
    keys() {
        return this._entries.keys();
    }
    values() {
        return this._entries.values();
    }
    entries() {
        return this._entries.entries();
    }
    clone(deep = false) {
        let entries;
        if (deep) {
            entries = [];
            for (let [key, value] of this._entries) {
                entries.push([
                    key,
                    value && typeof value == 'object' && value.clone
                        ? value.clone(true)
                        : value
                ]);
            }
        }
        return new this.constructor(entries || this);
    }
    absorbFrom(that) {
        if (!(that instanceof ObservableMap)) {
            throw TypeError('"that" must be instance of ObservableMap');
        }
        let entries = this._entries;
        let changed = false;
        for (let [key, value] of entries) {
            if (that.has(key)) {
                let thatValue = that.get(key);
                if (this._valueEquals || that._valueEquals
                    ? !(this._valueEquals || that._valueEquals)(value, thatValue)
                    : value !== thatValue &&
                        !(value &&
                            typeof value == 'object' &&
                            value.equals &&
                            value.equals(thatValue))) {
                    if (value &&
                        thatValue &&
                        typeof value == 'object' &&
                        typeof thatValue == 'object' &&
                        value.absorbFrom &&
                        value.absorbFrom ===
                            thatValue.absorbFrom) {
                        if (value.absorbFrom(thatValue)) {
                            changed = true;
                        }
                    }
                    else {
                        entries.set(key, thatValue);
                        changed = true;
                    }
                }
            }
            else {
                entries.delete(key);
                changed = true;
            }
        }
        for (let [key, value] of that) {
            if (!entries.has(key)) {
                entries.set(key, value);
                changed = true;
            }
        }
        if (changed) {
            this.emit(ObservableMap.EVENT_CHANGE, { subtype: 'absorbFrom' });
        }
        return changed;
    }
    toData() {
        let data = {};
        for (let [key, value] of this._entries) {
            data[key] =
                value && typeof value == 'object' && value.toData
                    ? value.toData()
                    : value;
        }
        return data;
    }
}
ObservableMap.EVENT_CHANGE = 'change';
ObservableMap.prototype[Symbol.iterator] = ObservableMap.prototype.entries;
