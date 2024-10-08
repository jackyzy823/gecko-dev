// |reftest| shell-option(--enable-float16array)
// Copyright (C) 2016 the V8 project authors. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.
/*---
esid: sec-%typedarray%.prototype.slice
description: >
  Does not throw a TypeError if buffer is detached on custom constructor and
  count <= 0. Using other targetType.
info: |
  22.2.3.24 %TypedArray%.prototype.slice ( start, end )

  Let A be ? TypedArraySpeciesCreate(O, « count »).
  If count > 0, then
    ...
  Return A

includes: [testTypedArray.js, detachArrayBuffer.js]
features: [align-detached-buffer-semantics-with-web-reality, Symbol.species, TypedArray]
---*/

testWithTypedArrayConstructors(function(TA) {
  let counter = 0;
  let sample, result, Other, other;
  let ctor = {};
  ctor[Symbol.species] = function(count) {
    counter++;
    Other = TA === Int16Array ? Int8Array : Int16Array;
    $DETACHBUFFER(sample.buffer);
    other = new Other(count);
    return other;
  };

  sample = new TA(0);
  sample.constructor = ctor;
  result = sample.slice();
  assert.sameValue(result.length, 0, 'The value of result.length is 0');
  assert.notSameValue(result.buffer, sample.buffer, 'The value of result.buffer is expected to not equal the value of `sample.buffer`');
  assert.sameValue(result.constructor, Other, 'The value of result.constructor is expected to equal the value of Other');
  assert.sameValue(result, other, 'The value of `result` is expected to equal the value of other');
  assert.sameValue(counter, 1, 'The value of `counter` is 1');

  sample = new TA(4);
  sample.constructor = ctor;
  sample.slice(1, 1); // count = 0;
  assert.sameValue(counter, 2, 'The value of `counter` is 2');
});

reportCompare(0, 0);
