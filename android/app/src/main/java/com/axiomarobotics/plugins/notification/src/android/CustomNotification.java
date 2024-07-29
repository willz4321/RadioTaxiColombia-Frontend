package com.axiomarobotics.plugins.notification.src.android;

import com.axiomarobotics.radiotaxi.MainActivity;

;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;

public class CustomNotification extends CordovaPlugin {
    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        if (action.equals("showNotification")) {
            String title = args.getString(0);
            String content = args.getString(1);
            ((MainActivity) this.cordova.getActivity()).showNotification(title, content);
            callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.OK));
            return true;
        }
        return false;
    }
}
