package com.example.testclient;

import androidx.appcompat.app.ActionBar;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.SharedElementCallback;

import android.annotation.TargetApi;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.net.http.SslError;
import android.os.AsyncTask;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.webkit.PermissionRequest;
import android.webkit.SslErrorHandler;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.EditText;
import android.widget.RadioGroup;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;

public class MainActivity extends AppCompatActivity {

    private static final String TAG = "RemoteNEMO_MainActivity";

    private static final String URL = "https://115.145.170.214:9002";

    private WebView mWebView;
    private WebSettings mWebSettings;

    private String mNewSession;


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        mNewSession = null;

        Intent intent = getIntent();
        mNewSession = intent.getExtras().getString("session");

        Toast.makeText(getApplicationContext(), "Session " + mNewSession + " will be load.", Toast.LENGTH_SHORT).show();

        mWebView = (WebView) findViewById(R.id.webView);

        mWebView.clearCache(true);
        mWebView.setWebViewClient(new WebViewClient(){
            @Override
            public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
                handler.proceed();
            }
        });

        mWebSettings = mWebView.getSettings();
        mWebSettings.setJavaScriptEnabled(true);
        //mWebSettings.setSupportMultipleWindows(true);
        mWebSettings.setJavaScriptCanOpenWindowsAutomatically(true);
        mWebSettings.setLoadWithOverviewMode(true);
        mWebSettings.setUseWideViewPort(true); // 화면 사이즈 맞추기 허용 여부
        mWebSettings.setSupportZoom(false); // 화면 줌 허용 여부
        mWebSettings.setBuiltInZoomControls(false); // 화면 확대 축소 허용 여부
        mWebSettings.setLayoutAlgorithm(WebSettings.LayoutAlgorithm.SINGLE_COLUMN); // 컨텐츠 사이즈 맞추기
        mWebSettings.setCacheMode(WebSettings.LOAD_NO_CACHE);
        mWebSettings.setDomStorageEnabled(true);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP)
        {
            mWebView.getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }

        Log.v(TAG, "Request New Window Session URL: "+ URL + "/#" + mNewSession);

        mWebView.loadUrl(URL + "/#" +mNewSession);
    }


}


