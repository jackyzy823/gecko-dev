/* -*- Mode: C++; tab-width: 8; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* vim: set ts=8 sts=2 et sw=2 tw=80: */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#ifndef mozilla_dom_AndroidContentSchemeBlobImpl_h
#define mozilla_dom_AndroidContentSchemeBlobImpl_h

#include "mozilla/dom/BindingDeclarations.h"
#include "mozilla/dom/BlobImpl.h"
#include "mozilla/Maybe.h"
#include "mozilla/Mutex.h"
#include "nsCOMPtr.h"

namespace mozilla::dom {

class AndroidContentSchemeBlobImpl : public BlobImpl {
 public:
  NS_INLINE_DECL_REFCOUNTING_INHERITED(AndroidContentSchemeBlobImpl, BlobImpl)

  // TODO

  // Create as a
  explicit AndroidContentSchemeBlobImpl(const nsAString& aContentSchemePath);

  void GetName(nsAString& aName) const override { aName = mName; }

  void SetName(const nsAString& aName) { mName = aName; }

  void GetDOMPath(nsAString& aPath) const override { aPath = mPath; }

  void SetDOMPath(const nsAString& aPath) override { mPath = aPath; }

  int64_t GetLastModified(ErrorResult& aRv) override;

  void GetMozFullPath(nsAString& aFileName, SystemCallerGuarantee /* unused */,
                      ErrorResult& aRv) override {
    GetMozFullPathInternal(aFileName, aRv);
  }

  void GetMozFullPathInternal(nsAString& aFilename, ErrorResult& aRv) override;

  uint64_t GetSize(ErrorResult& aRv) override;

  void GetType(nsAString& aType) override;

  void GetBlobImplType(nsAString& aBlobImplType) const override;

  size_t GetAllocationSize() const override { return 0; }

  size_t GetAllocationSize(
      FallibleTArray<BlobImpl*>& aVisitedBlobImpls) const override {
    return GetAllocationSize();
  }

  uint64_t GetSerialNumber() const override { return mSerialNumber; }

  const nsTArray<RefPtr<BlobImpl>>* GetSubBlobImpls() const override {
    return nullptr;
  }

  void CreateInputStream(nsIInputStream** aStream,
                         ErrorResult& aRv) const override;

  int64_t GetFileId() const override { return mFileId; }

  void SetLazyData(const nsAString& aName, const nsAString& aContentType,
                   uint64_t aLength, int64_t aLastModifiedDate) override {
    mName = aName;
    mContentType = aContentType;
    mLength.emplace(aLength);
    mLastModified.emplace(aLastModifiedDate);
  }

  bool IsMemoryFile() const override { return false; }
  // Not support folder in android.
  bool IsFile() const override { return true; }
  bool IsDirectory() const override { return false; };

  // TODO ???
  already_AddRefed<BlobImpl> CreateSlice(uint64_t aStart, uint64_t aLength,
                                         const nsAString& aContentType,
                                         ErrorResult& aRv) const override {
    return nullptr;
  }

 protected:
  ~AndroidContentSchemeBlobImpl() override = default;

  // TODO CreateSlice

  nsString mContentType;
  nsString mName;
  nsString mPath;  // The path relative to a directory chosen by the user
  nsString mMozFullPath;

  const uint64_t mSerialNumber;

  int64_t mFileId;

  Maybe<uint64_t> mLength;
  Maybe<int64_t> mLastModified;
};

}  // namespace mozilla::dom

#endif  // mozilla_dom_AndroidContentSchemeBlobImpl_h
