// |reftest| shell-option(--enable-temporal) skip-if(!this.hasOwnProperty('Temporal')||!xulRuntime.shell) -- Temporal is not enabled unconditionally, requires shell-options
// Copyright (C) 2018 Bloomberg LP. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: sec-temporal-duration-objects
description: toString() works as expected
features: [Temporal]
---*/

// serializing balance doesn't lose precision when values are precise
var d = Temporal.Duration.from({
  milliseconds: Number.MAX_SAFE_INTEGER,
  microseconds: Number.MAX_SAFE_INTEGER
});
assert.sameValue(`${ d }`, "PT9016206453995.731991S");

reportCompare(0, 0);
