package com.johnivansantoss.capartner

import android.Manifest
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothManager
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {
    /** Answer to the Dart side's turn-on request, sent once the user decides. */
    private var pendingEnable: MethodChannel.Result? = null

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL)
            .setMethodCallHandler { call, result ->
                when (call.method) {
                    "isEnabled" -> result.success(adapter()?.isEnabled == true)
                    "requestEnable" -> requestEnable(result)
                    else -> result.notImplemented()
                }
            }
    }

    private fun adapter(): BluetoothAdapter? =
        getSystemService(BluetoothManager::class.java)?.adapter

    /**
     * Shows Android's own "turn on Bluetooth" prompt, after asking for the
     * Nearby devices permission it needs on Android 12 and up. Apps may not
     * switch Bluetooth on silently since Android 13.
     */
    private fun requestEnable(result: MethodChannel.Result) {
        val adapter = adapter()
        when {
            adapter == null -> result.success(false)
            adapter.isEnabled -> result.success(true)
            pendingEnable != null ->
                result.error("busy", "Already asking to turn on Bluetooth.", null)
            else -> {
                pendingEnable = result
                if (needsConnectPermission()) {
                    requestPermissions(
                        arrayOf(Manifest.permission.BLUETOOTH_CONNECT),
                        PERMISSION_REQUEST,
                    )
                } else {
                    launchEnablePrompt()
                }
            }
        }
    }

    private fun needsConnectPermission(): Boolean =
        Build.VERSION.SDK_INT >= Build.VERSION_CODES.S &&
            checkSelfPermission(Manifest.permission.BLUETOOTH_CONNECT) !=
            PackageManager.PERMISSION_GRANTED

    @Suppress("DEPRECATION")
    private fun launchEnablePrompt() {
        startActivityForResult(
            Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE),
            ENABLE_REQUEST,
        )
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray,
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode != PERMISSION_REQUEST) return
        val granted = grantResults.firstOrNull() == PackageManager.PERMISSION_GRANTED
        if (granted) launchEnablePrompt() else finishEnable(false)
    }

    @Deprecated("Needed for the turn-on prompt's result.")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == ENABLE_REQUEST) finishEnable(resultCode == RESULT_OK)
    }

    private fun finishEnable(turnedOn: Boolean) {
        pendingEnable?.success(turnedOn)
        pendingEnable = null
    }

    private companion object {
        const val CHANNEL = "capartner/bluetooth"
        const val PERMISSION_REQUEST = 4101
        const val ENABLE_REQUEST = 4102
    }
}
