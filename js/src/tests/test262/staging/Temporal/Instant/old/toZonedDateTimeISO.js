// |reftest| shell-option(--enable-temporal) skip-if(!this.hasOwnProperty('Temporal')||!xulRuntime.shell) -- Temporal is not enabled unconditionally, requires shell-options
// Copyright (C) 2018 Bloomberg LP. All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/*---
esid: sec-temporal-instant-objects
description: Temporal.Instant.toZonedDateTimeISO() works
features: [Temporal]
---*/

var inst = Temporal.Instant.from("1976-11-18T14:23:30.123456789Z");

// throws without parameter
assert.throws(TypeError, () => inst.toZonedDateTimeISO());

// time zone parameter UTC
var zdt = inst.toZonedDateTimeISO("UTC");
assert.sameValue(inst.epochNanoseconds, zdt.epochNanoseconds);
assert.sameValue(`${ zdt }`, "1976-11-18T14:23:30.123456789+00:00[UTC]");

// time zone parameter non-UTC
var zdt = inst.toZonedDateTimeISO("-05:00");
assert.sameValue(inst.epochNanoseconds, zdt.epochNanoseconds);
assert.sameValue(`${ zdt }`, "1976-11-18T09:23:30.123456789-05:00[-05:00]");

reportCompare(0, 0);
