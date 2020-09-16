# cellx-collections

If you record to the cell an instance of class which inherits of `cellx.EventEmitter`,
then the cell will subscribe to its `change` event and will claim it as own:

```js
let value = cellx(new cellx.EventEmitter());

value.subscribe((err, evt) => {
    console.log(evt.target instanceof cellx.EventEmitter);
});

value().emit('change');
// => true
```

Due to this, you can create your collections, upon updating those collections you will update the cell containing them
and dependent cells will be recalculated. Two such collections already is added to the cellx:

## cellx.ObservableMap

Example:

```js
let map = new cellx.ObservableMap({
    key1: 1,
    key2: 2,
    key3: 3
});
```

`cellx.ObservableMap` repeats
[Map](https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Map) from ECMAScript 2015,
except for the following differences:
- inherits of `cellx.EventEmitter` and generates an event `change` when changing their records;
- has a method `clone`, which creates a copy of map;
- data on initialization can be not only an array but also in the form of an object (in this case,
only strings will be counted as keys, and the key difference between object and Map is in
the fact that the keys in the Map can be of any type) or another map.

## cellx.ObservableList

Example:

```js
let list = new cellx.ObservableList([1, 2, 3]);
```

Like `cellx.ObservableMap`, list generates an event `change` upon any change of its records.

During initialization the list may take option `itemComparator`, which will implement the assortment of its items:

```js
let list = new cellx.ObservableList([
    { x: 5 },
    { x: 1 },
    { x: 10 }
], {
    itemComparator: (a, b) => {
        if (a.x < b.x) { return -1; }
        if (a.x > b.x) { return 1; }
        return 0;
    }
});

console.log(list.toArray());
// => [{ x: 1 }, { x: 5 }, { x: 10 }]

list.addRange([{ x: 100 }, { x: -100 }, { x: 7 }]);

console.log(list.toArray());
// => [{ x: -100 }, { x: 1 }, { x: 5 }, { x: 7 }, { x: 10 }, { x: 100 }]
```

If instead of `itemComparator` you pass the option `sorted` with the value `true`, it will use the standard `itemComparator`:

```js
let list = new cellx.ObservableList([5, 1, 10], { sorted: true });

console.log(list.toArray());
// => [1, 5, 10]

list.addRange([100, -100, 7]);

console.log(list.toArray());
// => [-100, 1, 5, 7, 10, 100]
```

### Properties of cellx.ObservableList

#### length

Length of the list. Read-only.

#### itemComparator

Function for comparing items in the sorted list. Read-only.

#### sorted

Whether or not the list is sorted. Read-only.

### Methods of cellx.ObservableList

Important difference between list and array is that the list can't contain so-called "holes"
that is, when it will try to read or set the item of the index beyond the existing range of indexes,
an exception will be generated.
Range extension (adding of items) occurs through methods `add`, `addRange`, `insert` and `insertRange`.
In such case, in the last two methods passed `index` can not be longer than the length of the list.

Sorted list suggests that its items are always in sorted order. Methods
`set`, `setRange`, `insert` and `insertRange` are contrary to this statement, they either will break the correct order
of sorting or (for preservation of this order) will install/paste past the specified index, i.e.
will not work properly. Therefore, when you call the sorted list, they always generate an exception. It is possible to
add items to the sorted list through the methods `add` and `addRange`, or during initialization of the list.

#### contains

Type signature: `(item) -> boolean;`.

Checks if the item is in the list.

#### indexOf

Type signature: `(item, fromIndex?: int) -> int;`.

#### lastIndexOf

Type signature: `(item, fromIndex?: int) -> int;`.

#### get

Type signature: `(index: int) -> *;`.

#### getRange

Type signature: `(index: int, count?: uint) -> Array;`.

If `count` is unspecified it makes copies till the end of the list.

#### set

Type signature: `(index: int, item) -> cellx.ObservableList;`.

#### setRange

Type signature: `(index: int, items: Array) -> cellx.ObservableList;`.

#### add

Type signature: `(item, unique?: boolean) -> cellx.ObservableList;`.

#### addRange

Type signature: `(items: Array, uniques?: boolean) -> cellx.ObservableList;`.

#### insert

Type signature: `(index: int, item) -> cellx.ObservableList;`.

#### insertRange

Type signature: `(index: int, items: Array) -> cellx.ObservableList;`.

#### remove

Type signature: `(item, fromIndex?: int) -> boolean;`.

Removes the first occurrence of `item` in the list.

#### removeAll

Type signature: `(item, fromIndex?: int) -> boolean;`.

It removes all occurrences of `item` list.

#### removeAt

Type signature: `(index: int) -> *;`.

#### removeRange

Type signature: `(index: int, count?: uint) -> Array;`.

If `count` is unspecified it will remove everything till the end of the list.

#### replace

Type signature: `(oldItem, newItem, fromIndex?: int) -> boolean;`.

#### replaceAll

Type signature: `(oldItem, newItem, fromIndex?: int) -> boolean;`.

#### clear

Type signature: `() -> cellx.ObservableList;`.

#### join

Type signature: `(separator?: string) -> string;`.

#### forEach

Type signature: `(cb: (item, index: uint, list: cellx.ObservableList), context?);`.

#### map

Type signature: `(cb: (item, index: uint, list: cellx.ObservableList) -> *, context?) -> Array;`.

#### filter

Type signature: `(cb: (item, index: uint, list: cellx.ObservableList) -> ?boolean, context?) -> Array;`.

#### every

Type signature: `(cb: (item, index: uint, list: cellx.ObservableList) -> ?boolean, context?) -> boolean;`.

#### some

Type signature: `(cb: (item, index: uint, list: cellx.ObservableList) -> ?boolean, context?) -> boolean;`.

#### reduce

Type signature: `(cb: (accumulator, item, index: uint, list: cellx.ObservableList) -> *, initialValue?) -> *;`.

#### reduceRight

Type signature: `(cb: (accumulator, item, index: uint, list: cellx.ObservableList) -> *, initialValue?) -> *;`.

#### find

Type signature: `(cb: (item, index: uint, list: cellx.ObservableList) -> ?boolean, fromIndex?: int) -> *;`.

#### findLast

Type signature: `(cb: (item, index: uint, list: cellx.ObservableList) -> ?boolean, fromIndex?: int) -> *;`.

#### findIndex

Type signature: `(cb: (item, index: uint, list: cellx.ObservableList) -> ?boolean, fromIndex?: int) -> int;`.

#### findLastIndex

Type signature: `(cb: (item, index: uint, list: cellx.ObservableList) -> ?boolean, fromIndex?: int) -> int;`.

#### clone

Type signature: `() -> cellx.ObservableList;`.

#### toArray

Type signature: `() -> Array;`.

#### toString

Type signature: `() -> string;`.
