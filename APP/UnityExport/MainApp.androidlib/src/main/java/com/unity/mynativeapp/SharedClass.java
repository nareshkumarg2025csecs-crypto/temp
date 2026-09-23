package com.unity.mynativeapp;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

import com.unity3d.player.UnityPlayer;

public class SharedClass {
    private static final String TAG = "SharedClass";

    public static void showMainActivity(String message) {
        showMainActivity(UnityPlayer.currentActivity, message);
    }

    public static void showMainActivity(Activity activity, String message) {
        if (activity == null) {
            activity = UnityPlayer.currentActivity;
        }
        if (activity != null) {
            Intent intent = new Intent((Context) activity, MainActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            intent.putExtra("returnedFromUnity", true);
            activity.startActivity(intent);
        }
    }

    public static void finishUnityGame() {
        Log.i(TAG, "finishUnityGame called from Unity script");
        Activity activity = UnityPlayer.currentActivity;
        if (activity != null) {
            // Send broadcast to React Native module
            Intent intent = new Intent("com.mobileapp.UNITY_GAME_ENDED");
            activity.sendBroadcast(intent);

            // Finish the activity to close Unity experience
            activity.finish();
        }
    }

    public static void addControlsToUnityFrame(Activity activity) {
        // Optional overlay controls if needed
    }
}
