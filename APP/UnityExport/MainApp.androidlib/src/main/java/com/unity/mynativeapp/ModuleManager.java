package com.unity.mynativeapp;

import android.content.Context;
import android.content.Intent;
import android.util.Log;

public class ModuleManager {
    private static final String TAG = "ModuleManager";
    public static final String EXTRA_MODULE_ID = "MODULE_ID";

    public enum Module {
        MODULE_1("Module 1", MainUnityActivity.class);

        private final String title;
        private final Class<?> activityClass;

        Module(String title, Class<?> activityClass) {
            this.title = title;
            this.activityClass = activityClass;
        }

        public String getTitle() {
            return title;
        }

        public Class<?> getActivityClass() {
            return activityClass;
        }
    }

    public static void launchModule(Context context, Module module) {
        if (context == null || module == null) {
            Log.e(TAG, "Cannot launch module with null context or module.");
            return;
        }

        Log.i(TAG, "Launching module: " + module.getTitle());
        Intent intent = new Intent(context, module.getActivityClass());
        intent.setFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
        intent.putExtra(EXTRA_MODULE_ID, module.name());
        context.startActivity(intent);
    }
}
