/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/ */

package org.mozilla.geckoview.test;

import android.content.ContentProvider;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.provider.OpenableColumns;
import java.io.File;
import java.io.FileNotFoundException;

/** FileContentProvider provides ParcelFileDescriptor via content resolver by content:// */
public class FileContentProvider extends ContentProvider {
  // Same as the authorities defined in AndroidManifest.xml
  public static final String AUTHORITY = "org.mozilla.geckoview.test.file";

  public static final Uri CONTENT_SCHEME_URI =
      Uri.parse(String.format("%s://%s/p/a/t/h/to/1", ContentResolver.SCHEME_CONTENT, AUTHORITY));
  public static final Uri NOT_FOUND_CONTENT_SCHEME_URI =
      Uri.parse(String.format("%s://%s/2", ContentResolver.SCHEME_CONTENT, AUTHORITY));
  public static final Uri NOT_PERMISSION_CONTENT_SCHEME_URI =
      Uri.parse(String.format("%s://%s/3", ContentResolver.SCHEME_CONTENT, AUTHORITY));

  private static File sFile;
  private static boolean sHasDisplayName;

  /**
   * Set test file that is used from content resolver.
   *
   * @param file test file
   */
  public static void setFile(final File file, final boolean hasDisplayName) {
    sFile = file;
    sHasDisplayName = hasDisplayName;
  }

  @Override
  public ParcelFileDescriptor openFile(final Uri uri, final String mode)
      throws FileNotFoundException {
    if (uri.equals(NOT_PERMISSION_CONTENT_SCHEME_URI)) {
      throw new SecurityException("The caller does not have permission to access the file.");
    }

    if (uri.equals(NOT_FOUND_CONTENT_SCHEME_URI)) {
      throw new FileNotFoundException("No file for: " + uri);
    }

    if (uri.equals(CONTENT_SCHEME_URI)) {
      if (sFile == null) {
        throw new FileNotFoundException("No file for: " + uri);
      }
      return ParcelFileDescriptor.open(sFile, ParcelFileDescriptor.parseMode(mode));
    }
    // all other uris are not found
    throw new FileNotFoundException("No file for: " + uri);
  }

  @Override
  public Cursor query(
      final Uri uri,
      final String[] projection,
      final String selection,
      final String[] selectionArgs,
      final String sortOrder) {
    if (!uri.equals(CONTENT_SCHEME_URI)) {
      return null;
    }

    // Don't return the absoulte path
    if (projection.length == 1 && projection[0] == "_data") {
      return null;
    }

    if (projection.length == 1 && projection[0] == OpenableColumns.DISPLAY_NAME) {
      final String[] columns = {OpenableColumns.DISPLAY_NAME};
      final String[] row = {sHasDisplayName ? sFile.getName() : null};

      MatrixCursor cursor = new MatrixCursor(columns);
      cursor.addRow(row);
      return cursor;
    }

    return null;
  }

  @Override
  public boolean onCreate() {
    return true;
  }

  @Override
  public String getType(final Uri uri) {
    return null;
  }

  @Override
  public Uri insert(final Uri uri, final ContentValues values) {
    return null;
  }

  @Override
  public int delete(final Uri uri, final String selection, final String[] selectionArgs) {
    return 0;
  }

  @Override
  public int update(
      final Uri uri,
      final ContentValues values,
      final String selection,
      final String[] selectionArgs) {
    return 0;
  }
}
