// |reftest| shell-option(--enable-temporal) skip-if(!this.hasOwnProperty('Temporal')||!xulRuntime.shell) -- Temporal is not enabled unconditionally, requires shell-options
// Copyright (C) 2022 Igalia, S.L. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: sec-temporal.plaintime.from
description: reject value for overflow option
includes: [temporalHelpers.js]
features: [Temporal]
---*/

assert.throws(RangeError, () => Temporal.PlainTime.from({ hour: 26 }, { overflow: "reject" }));
TemporalHelpers.assertPlainTime(Temporal.PlainTime.from({ hour: 22 }, { overflow: "reject" }),
  22, 0, 0, 0, 0, 0);

reportCompare(0, 0);
