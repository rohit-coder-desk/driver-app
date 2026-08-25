package com.driverapp

import android.media.MediaPlayer
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.uimanager.ViewManager

class AudioPlayerModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = "AudioPlayerModule"

    @ReactMethod
    fun playNotificationSound(promise: Promise) {
        try {
            val resId = reactContext.resources.getIdentifier(
                "notification_chime",
                "raw",
                reactContext.packageName
            )
            if (resId != 0) {
                val mediaPlayer = MediaPlayer.create(reactContext, resId)
                if (mediaPlayer == null) {
                    promise.resolve(false)
                    return
                }

                var isHandled = false

                mediaPlayer.setOnCompletionListener { mp ->
                    if (!isHandled) {
                        isHandled = true
                        try {
                            mp.release()
                        } catch (_: Exception) {}
                        promise.resolve(true)
                    }
                }

                mediaPlayer.setOnErrorListener { mp, _, _ ->
                    if (!isHandled) {
                        isHandled = true
                        try {
                            mp.release()
                        } catch (_: Exception) {}
                        promise.resolve(false)
                    }
                    true
                }

                mediaPlayer.start()
            } else {
                promise.resolve(false)
            }
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }
}

class SoundPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(AudioPlayerModule(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}
