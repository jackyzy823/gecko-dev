/* -*- Mode: C++; tab-width: 8; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set ts=8 sts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#include "AndroidContentSchemeBlobImpl.h"
#include "BaseBlobImpl.h"
// TODO ?
#include "GeckoViewInputStream.h"

namespace mozilla::dom {

AndroidContentSchemeBlobImpl::AndroidContentSchemeBlobImpl(
    const nsAString& aContentSchemePath)
    : mPath(aContentSchemePath),
      mSerialNumber(BaseBlobImpl::NextSerialNumber()) {}

void AndroidContentSchemeBlobImpl::CreateInputStream(nsIInputStream** aStream,
                                                     ErrorResult& aRv) const {
  nsresult rv = GeckoViewContentInputStream::getInstance(
      NS_ConvertUTF16toUTF8(mPath), aStream);

  if (NS_WARN_IF(NS_FAILED(rv))) {
    aRv.Throw(rv);
  }
}

int64_t AndroidContentSchemeBlobImpl::GetLastModified(ErrorResult& aRv) {
  return mLastModified.value();
}
void AndroidContentSchemeBlobImpl::GetMozFullPathInternal(nsAString& aFilename,
                                          ErrorResult& aRv) {}

uint64_t AndroidContentSchemeBlobImpl::GetSize(ErrorResult& aRv) {
  return mLength.value();
}
void AndroidContentSchemeBlobImpl::GetType(nsAString& aType) {
}

void AndroidContentSchemeBlobImpl::GetBlobImplType(nsAString& aBlobImplType) const {
  aBlobImplType = u"AndroidContentSchemeBlobImpl"_ns;
}
}  // namespace mozilla::dom