(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('cellx')) :
	typeof define === 'function' && define.amd ? define(['exports', 'cellx'], factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global['cellx-collections'] = {}, global.cellx));
}(this, (function (exports, cellx) { 'use strict';

	const hasOwn = Object.prototype.hasOwnProperty;
	class ObservableMap extends cellx.EventEmitter {
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

	const push = Array.prototype.push;
	const splice = Array.prototype.splice;
	const defaultItemComparator = (a, b) => {
	    return a < b ? -1 : a > b ? 1 : 0;
	};
	class ObservableList extends cellx.EventEmitter {
	    constructor(items, options) {
	        super();
	        this._items = [];
	        if (options) {
	            if (options.itemEquals) {
	                this._itemEquals = options.itemEquals;
	            }
	            if ((options.itemComparator && options.sorted !== false) || options.sorted) {
	                this._itemComparator = options.itemComparator || defaultItemComparator;
	                this._sorted = true;
	            }
	            else {
	                this._itemComparator = null;
	                this._sorted = false;
	            }
	        }
	        if (items) {
	            if (this._sorted) {
	                if (items instanceof ObservableList) {
	                    items = items._items;
	                }
	                for (let i = 0, l = items.length; i < l; i++) {
	                    this._insertSortedValue(items[i]);
	                }
	            }
	            else {
	                push.apply(this._items, items instanceof ObservableList ? items._items : items);
	            }
	        }
	    }
	    get length() {
	        return this._items.length;
	    }
	    set length(value) {
	        if (this._items.length != value) {
	            if (value > this._items.length) {
	                throw RangeError('Length out of valid range');
	            }
	            this.emit(ObservableList.EVENT_CHANGE);
	            this._items.length = value;
	        }
	    }
	    get itemEquals() {
	        return this._itemEquals;
	    }
	    get itemComparator() {
	        return this._itemComparator;
	    }
	    get sorted() {
	        return this._sorted;
	    }
	    onChange(listener, context) {
	        return this.on(ObservableList.EVENT_CHANGE, listener, context);
	    }
	    offChange(listener, context) {
	        return this.off(ObservableList.EVENT_CHANGE, listener, context);
	    }
	    _validateIndex(index, allowEndIndex = false) {
	        if (index === undefined) {
	            return index;
	        }
	        if (index < 0) {
	            index += this._items.length;
	            if (index < 0) {
	                throw RangeError('Index out of valid range');
	            }
	        }
	        else if (index > this._items.length - (allowEndIndex ? 0 : 1)) {
	            throw RangeError('Index out of valid range');
	        }
	        return index;
	    }
	    contains(item) {
	        return this._items.indexOf(item) != -1;
	    }
	    indexOf(item, fromIndex) {
	        return this._items.indexOf(item, this._validateIndex(fromIndex, true));
	    }
	    lastIndexOf(item, fromIndex) {
	        return this._items.lastIndexOf(item, fromIndex === undefined ? -1 : this._validateIndex(fromIndex, true));
	    }
	    get(index) {
	        return this._items[this._validateIndex(index, true)];
	    }
	    getRange(index, count) {
	        index = this._validateIndex(index, true);
	        if (count === undefined) {
	            return this._items.slice(index);
	        }
	        if (index + count > this._items.length) {
	            throw RangeError('Sum of "index" and "count" out of valid range');
	        }
	        return this._items.slice(index, index + count);
	    }
	    set(index, item) {
	        if (this._sorted) {
	            throw TypeError('Cannot set to sorted list');
	        }
	        index = this._validateIndex(index, true);
	        if (!Object.is(item, this._items[index])) {
	            this._items[index] = item;
	            this.emit(ObservableList.EVENT_CHANGE);
	        }
	        return this;
	    }
	    setRange(index, items) {
	        if (this._sorted) {
	            throw TypeError('Cannot set to sorted list');
	        }
	        index = this._validateIndex(index, true);
	        if (items instanceof ObservableList) {
	            items = items._items;
	        }
	        let itemCount = items.length;
	        if (!itemCount) {
	            return this;
	        }
	        let listItems = this._items;
	        if (index + itemCount > listItems.length) {
	            throw RangeError('Sum of "index" and "items.length" out of valid range');
	        }
	        let changed = false;
	        for (let i = index + itemCount; i > index;) {
	            let item = items[--i - index];
	            if (!Object.is(item, listItems[i])) {
	                listItems[i] = item;
	                changed = true;
	            }
	        }
	        if (changed) {
	            this.emit(ObservableList.EVENT_CHANGE);
	        }
	        return this;
	    }
	    add(item, unique = false) {
	        if (unique && this._items.indexOf(item) != -1) {
	            return this;
	        }
	        if (this._sorted) {
	            this._insertSortedValue(item);
	        }
	        else {
	            this._items.push(item);
	        }
	        this.emit(ObservableList.EVENT_CHANGE);
	        return this;
	    }
	    addRange(items, uniques = false) {
	        if (items instanceof ObservableList) {
	            items = items._items;
	        }
	        if (items.length) {
	            if (uniques) {
	                let listItems = this._items;
	                let sorted = this._sorted;
	                let changed = false;
	                for (let item of items) {
	                    if (listItems.indexOf(item) == -1) {
	                        if (sorted) {
	                            this._insertSortedValue(item);
	                        }
	                        else {
	                            listItems.push(item);
	                        }
	                        changed = true;
	                    }
	                }
	                if (changed) {
	                    this.emit(ObservableList.EVENT_CHANGE);
	                }
	            }
	            else {
	                if (this._sorted) {
	                    for (let i = 0, l = items.length; i < l; i++) {
	                        this._insertSortedValue(items[i]);
	                    }
	                }
	                else {
	                    push.apply(this._items, items);
	                }
	                this.emit(ObservableList.EVENT_CHANGE);
	            }
	        }
	        return this;
	    }
	    insert(index, item) {
	        if (this._sorted) {
	            throw TypeError('Cannot insert to sorted list');
	        }
	        this._items.splice(this._validateIndex(index, true), 0, item);
	        this.emit(ObservableList.EVENT_CHANGE);
	        return this;
	    }
	    insertRange(index, items) {
	        if (this._sorted) {
	            throw TypeError('Cannot insert to sorted list');
	        }
	        index = this._validateIndex(index, true);
	        if (items instanceof ObservableList) {
	            items = items._items;
	        }
	        if (items.length) {
	            splice.apply(this._items, [index, 0].concat(items));
	            this.emit(ObservableList.EVENT_CHANGE);
	        }
	        return this;
	    }
	    remove(item, fromIndex) {
	        let index = this._items.indexOf(item, this._validateIndex(fromIndex, true));
	        if (index == -1) {
	            return false;
	        }
	        this._items.splice(index, 1);
	        this.emit(ObservableList.EVENT_CHANGE);
	        return true;
	    }
	    removeAll(item, fromIndex) {
	        let index = this._validateIndex(fromIndex, true);
	        let items = this._items;
	        let changed = false;
	        while ((index = items.indexOf(item, index)) != -1) {
	            items.splice(index, 1);
	            changed = true;
	        }
	        if (changed) {
	            this.emit(ObservableList.EVENT_CHANGE);
	        }
	        return changed;
	    }
	    removeAt(index) {
	        let item = this._items.splice(this._validateIndex(index), 1)[0];
	        this.emit(ObservableList.EVENT_CHANGE);
	        return item;
	    }
	    removeRange(index, count) {
	        index = this._validateIndex(index, true);
	        if (count === undefined) {
	            count = this._items.length - index;
	            if (!count) {
	                return [];
	            }
	        }
	        else {
	            if (!count) {
	                return [];
	            }
	            if (index + count > this._items.length) {
	                throw RangeError('Sum of "index" and "count" out of valid range');
	            }
	        }
	        let removedItems = this._items.splice(index, count);
	        this.emit(ObservableList.EVENT_CHANGE);
	        return removedItems;
	    }
	    replace(oldItem, newItem, fromIndex) {
	        if (this._sorted) {
	            throw TypeError('Cannot replace in sorted list');
	        }
	        let index = this._items.indexOf(oldItem, this._validateIndex(fromIndex, true));
	        if (index == -1) {
	            return false;
	        }
	        this._items[index] = newItem;
	        this.emit(ObservableList.EVENT_CHANGE);
	        return true;
	    }
	    replaceAll(oldItem, newItem, fromIndex) {
	        if (this._sorted) {
	            throw TypeError('Cannot replace in sorted list');
	        }
	        let items = this._items;
	        let changed = false;
	        for (let index = items.indexOf(oldItem, this._validateIndex(fromIndex, true)); index != -1; index = items.indexOf(oldItem, index + 1)) {
	            items[index] = newItem;
	            changed = true;
	        }
	        if (changed) {
	            this.emit(ObservableList.EVENT_CHANGE);
	        }
	        return changed;
	    }
	    clear() {
	        if (this._items.length) {
	            this._items.length = 0;
	            this.emit(ObservableList.EVENT_CHANGE);
	        }
	        return this;
	    }
	    equals(that) {
	        if (!(that instanceof ObservableList)) {
	            return false;
	        }
	        let items = this._items;
	        let thatItems = that._items;
	        if (items.length != thatItems.length) {
	            return false;
	        }
	        for (let i = items.length; i;) {
	            let item = items[--i];
	            let thatItem = thatItems[i];
	            if (this._itemEquals || that._itemEquals
	                ? !(this._itemEquals || that._itemEquals)(item, thatItem)
	                : item !== thatItem &&
	                    !(item &&
	                        typeof item == 'object' &&
	                        item.equals &&
	                        item.equals(thatItem))) {
	                return false;
	            }
	        }
	        return true;
	    }
	    join(separator) {
	        return this._items.join(separator);
	    }
	    findIndex(cb, fromIndex = 0) {
	        let items = this._items;
	        for (let i = this._validateIndex(fromIndex, true), l = items.length; i < l; i++) {
	            if (cb(items[i], i, this)) {
	                return i;
	            }
	        }
	        return -1;
	    }
	    findLastIndex(cb, fromIndex) {
	        let items = this._items;
	        let index = fromIndex === undefined ? items.length - 1 : this._validateIndex(fromIndex, true);
	        if (index >= 0) {
	            for (;; index--) {
	                if (cb(items[index], index, this)) {
	                    return index;
	                }
	                if (!index) {
	                    break;
	                }
	            }
	        }
	        return -1;
	    }
	    find(cb, fromIndex) {
	        let foundIndex = this.findIndex(cb, fromIndex);
	        return foundIndex == -1 ? undefined : this._items[foundIndex];
	    }
	    findLast(cb, fromIndex) {
	        let foundIndex = this.findLastIndex(cb, fromIndex);
	        return foundIndex == -1 ? undefined : this._items[foundIndex];
	    }
	    clone(deep = false) {
	        return new this.constructor(deep
	            ? this._items.map((item) => item && typeof item == 'object' && item.clone
	                ? item.clone(true)
	                : item)
	            : this, {
	            itemComparator: this._itemComparator || undefined,
	            sorted: this._sorted
	        });
	    }
	    absorbFrom(that) {
	        if (!(that instanceof ObservableList)) {
	            throw TypeError('"that" must be instance of ObservableList');
	        }
	        let items = this._items;
	        let thatItems = that._items;
	        let itemsLen = items.length;
	        let thanItemsLen = thatItems.length;
	        let changed = false;
	        if (itemsLen != thanItemsLen) {
	            items.length = thanItemsLen;
	            changed = true;
	        }
	        for (let i = thanItemsLen; i;) {
	            let item = items[--i];
	            let thatItem = thatItems[i];
	            if (i < itemsLen && (this._itemEquals || that._itemEquals)
	                ? !(this._itemEquals || that._itemEquals)(item, thatItem)
	                : item !== thatItem &&
	                    !(item &&
	                        typeof item == 'object' &&
	                        item.equals &&
	                        item.equals(thatItem))) {
	                if (item &&
	                    thatItem &&
	                    typeof item == 'object' &&
	                    typeof thatItem == 'object' &&
	                    item.absorbFrom &&
	                    item.absorbFrom === thatItem.absorbFrom) {
	                    if (item.absorbFrom(thatItem)) {
	                        changed = true;
	                    }
	                }
	                else {
	                    items[i] = thatItem;
	                    changed = true;
	                }
	            }
	        }
	        if (changed) {
	            this.emit(ObservableList.EVENT_CHANGE);
	        }
	        return changed;
	    }
	    toArray() {
	        return this._items.slice();
	    }
	    toString() {
	        return this._items.join();
	    }
	    toData() {
	        return this._items.map((item) => item && typeof item == 'object' && item.toData ? item.toData() : item);
	    }
	    _insertSortedValue(item) {
	        let items = this._items;
	        let itemComparator = this._itemComparator;
	        let lowIndex = 0;
	        let highIndex = items.length;
	        while (lowIndex != highIndex) {
	            let midIndex = (lowIndex + highIndex) >> 1;
	            if (itemComparator(item, items[midIndex]) < 0) {
	                highIndex = midIndex;
	            }
	            else {
	                lowIndex = midIndex + 1;
	            }
	        }
	        items.splice(lowIndex, 0, item);
	    }
	}
	ObservableList.EVENT_CHANGE = 'change';
	['forEach', 'map', 'filter', 'every', 'some'].forEach((name) => {
	    ObservableList.prototype[name] = function (cb, context) {
	        return this._items[name]((item, index) => cb.call(context, item, index, this));
	    };
	});
	['reduce', 'reduceRight'].forEach((name) => {
	    ObservableList.prototype[name] = function (cb, initialValue) {
	        let wrapper = (accumulator, item, index) => cb(accumulator, item, index, this);
	        return arguments.length >= 2
	            ? this._items[name](wrapper, initialValue)
	            : this._items[name](wrapper);
	    };
	});
	[
	    ['keys', (index) => index],
	    ['values', (_index, item) => item],
	    ['entries', (index, item) => [index, item]]
	].forEach((settings) => {
	    let getStepValue = settings[1];
	    ObservableList.prototype[settings[0]] = function () {
	        let items = this._items;
	        let index = 0;
	        let done = false;
	        return {
	            next() {
	                if (!done) {
	                    if (index < items.length) {
	                        return {
	                            value: getStepValue(index, items[index++]),
	                            done: false
	                        };
	                    }
	                    done = true;
	                }
	                return {
	                    value: undefined,
	                    done: true
	                };
	            }
	        };
	    };
	});
	ObservableList.prototype[Symbol.iterator] = ObservableList.prototype.values;

	exports.ObservableList = ObservableList;
	exports.ObservableMap = ObservableMap;

	Object.defineProperty(exports, '__esModule', { value: true });

})));
