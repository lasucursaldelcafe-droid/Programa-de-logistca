package com.spe.personaleventos;

import android.Manifest;
import android.content.Intent;
import android.net.Uri;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

/**
 * Permisos de teléfono + abrir el marcador (ACTION_DIAL).
 * Usado desde Trabajadores en vivo para llamar al celular del personal.
 */
@CapacitorPlugin(
    name = "PhoneCall",
    permissions = {
        @Permission(
            alias = "phone",
            strings = {
                Manifest.permission.CALL_PHONE,
                Manifest.permission.READ_PHONE_STATE
            }
        )
    }
)
public class PhoneCallPlugin extends Plugin {

    @PluginMethod
    public void checkPermissions(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("phone", permissionStatus());
        call.resolve(ret);
    }

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        if (getPermissionState("phone") == PermissionState.GRANTED) {
            JSObject ret = new JSObject();
            ret.put("phone", "granted");
            call.resolve(ret);
            return;
        }
        requestPermissionForAlias("phone", call, "permissionsCallback");
    }

    @PermissionCallback
    private void permissionsCallback(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("phone", permissionStatus());
        call.resolve(ret);
    }

    @PluginMethod
    public void dial(PluginCall call) {
        String number = call.getString("number");
        if (number == null || number.trim().isEmpty()) {
            call.reject("Falta el número de teléfono");
            return;
        }
        String cleaned = number.trim();
        Intent intent = new Intent(Intent.ACTION_DIAL, Uri.parse("tel:" + Uri.encode(cleaned)));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }

    private String permissionStatus() {
        PermissionState state = getPermissionState("phone");
        if (state == PermissionState.GRANTED) return "granted";
        if (state == PermissionState.DENIED) return "denied";
        return "prompt";
    }
}
