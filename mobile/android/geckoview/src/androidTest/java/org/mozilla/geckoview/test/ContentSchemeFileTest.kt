/* -*- Mode: Java; c-basic-offset: 4; tab-width: 4; indent-tabs-mode: nil; -*-
 * Any copyright is dedicated to the Public Domain.
   http://creativecommons.org/publicdomain/zero/1.0/ */

package org.mozilla.geckoview.test

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.filters.MediumTest
import androidx.test.platform.app.InstrumentationRegistry
import org.hamcrest.CoreMatchers.equalTo
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mozilla.geckoview.GeckoResult
import org.mozilla.geckoview.GeckoSession
import org.mozilla.geckoview.GeckoSession.PromptDelegate
import java.io.File

@RunWith(AndroidJUnit4::class)
@MediumTest
class ContentSchemeFileTest : BaseSessionTest() {
    lateinit var refFile: File
    val context = InstrumentationRegistry.getInstrumentation().targetContext

    @Before fun setup() {
        refFile = File.createTempFile("prefix", ".suffix", context.cacheDir)
    }

    @After fun teardown() {
        // Reset FileContentProvider each test.
        FileContentProvider.setFile(null, false)
        if (::refFile.isInitialized) {
            refFile.delete()
        }
    }

    @Test fun filePickerOpenContentSchemeFileSucceeds() {
        val fileContent = "This is random text"
        refFile.writeText(fileContent)

        FileContentProvider.setFile(refFile, true)

        sessionRule.setPrefsUntilTestEnd(mapOf("dom.disable_open_during_load" to false))

        mainSession.loadTestPath(PROMPT_HTML_PATH)
        mainSession.waitForPageStop()

        mainSession.setPromptDelegate(object : PromptDelegate {
            override fun onFilePrompt(session: GeckoSession, prompt: PromptDelegate.FilePrompt): GeckoResult<PromptDelegate.PromptResponse> {
                return GeckoResult.fromValue(prompt.confirm(context, arrayOf(FileContentProvider.CONTENT_SCHEME_URI)))
            }
        })

        // Wait for the file being selected.
        val promise = mainSession.evaluatePromiseJS("new Promise(r => document.getElementById('fileexample').addEventListener('change', r, { once: true }))")

        mainSession.evaluateJS("document.getElementById('fileexample').click();")

        // Validate the selected file's properties
        promise.value

        val count = mainSession.evaluateJS("document.getElementById('fileexample').files.length") as Double
        assertThat("Count of files should be 1", count, equalTo(1.0))

        val filename = mainSession.evaluateJS("document.getElementById('fileexample').files[0].name") as String
        assertThat("Filename should be the display name", filename, equalTo(refFile.name))

        val filesize = mainSession.evaluateJS("document.getElementById('fileexample').files[0].size") as Double
        assertThat("File size should be the same", filesize, equalTo(refFile.length().toDouble()))

        // Note: Under Android Emulator (Android 7.0), File.lastModified() is losing milliseconds (always ends in 000)
        // Ref: https://bugs.openjdk.org/browse/JDK-8177809
        val lastModified = mainSession.evaluateJS("document.getElementById('fileexample').files[0].lastModified") as Long
        assertThat("File last modified time should be the same", lastModified.div(1000), equalTo(refFile.lastModified().div(1000)))

        val filePromise = mainSession.evaluatePromiseJS("document.getElementById('fileexample').files[0].text()")
        assertThat("The content of the file should be the same", filePromise.value as String, equalTo(fileContent))
    }

    @Test fun useIdIfNoDisplayName() {
        FileContentProvider.setFile(refFile, false)

        sessionRule.setPrefsUntilTestEnd(mapOf("dom.disable_open_during_load" to false))

        mainSession.loadTestPath(PROMPT_HTML_PATH)
        mainSession.waitForPageStop()

        mainSession.setPromptDelegate(object : PromptDelegate {
            override fun onFilePrompt(session: GeckoSession, prompt: PromptDelegate.FilePrompt): GeckoResult<PromptDelegate.PromptResponse> {
                return GeckoResult.fromValue(prompt.confirm(context, arrayOf(FileContentProvider.CONTENT_SCHEME_URI)))
            }
        })

        // Wait for the file being selected.
        val promise = mainSession.evaluatePromiseJS("new Promise(r => document.getElementById('fileexample').addEventListener('change', r, { once: true }))")

        mainSession.evaluateJS("document.getElementById('fileexample').click();")

        // Validate the selected file's properties
        promise.value

        val count = mainSession.evaluateJS("document.getElementById('fileexample').files.length") as Double
        assertThat("Count of files should be 1", count, equalTo(1.0))

        val filename = mainSession.evaluateJS("document.getElementById('fileexample').files[0].name") as String
        assertThat("Filename should be the unique numeric identifier if no display name", filename, equalTo(FileContentProvider.CONTENT_SCHEME_URI.getLastPathSegment()))
    }

    @Test fun filePickerOpenContentSchemeFileFailed() {
        sessionRule.setPrefsUntilTestEnd(mapOf("dom.disable_open_during_load" to false))

        mainSession.loadTestPath(PROMPT_HTML_PATH)
        mainSession.waitForPageStop()

        arrayOf(FileContentProvider.NOT_PERMISSION_CONTENT_SCHEME_URI, FileContentProvider.NOT_PERMISSION_CONTENT_SCHEME_URI).forEach {
            mainSession.setPromptDelegate(object : PromptDelegate {
                override fun onFilePrompt(session: GeckoSession, prompt: PromptDelegate.FilePrompt): GeckoResult<PromptDelegate.PromptResponse> {
                    return GeckoResult.fromValue(prompt.confirm(context, arrayOf(it)))
                }
            })

            // Wait for the file being selected.
            val promise = mainSession.evaluatePromiseJS("new Promise(r => document.getElementById('fileexample').addEventListener('cancel', r, { once: true }))")

            mainSession.evaluateJS("document.getElementById('fileexample').click();")

            // Validate the selected file's properties
            promise.value
            val count = mainSession.evaluateJS("document.getElementById('fileexample').files.length") as Double
            assertThat("Count of files should be 0", count, equalTo(0.0))
        }
    }
}
