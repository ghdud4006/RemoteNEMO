package com.example.testclient;

import androidx.appcompat.app.AppCompatActivity;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.EditText;
import android.widget.Toast;

public class RootActivity extends AppCompatActivity {

    private static final String TAG = "RemoteNEMO_RootActivity";

    private EditText mEdSession;
    private String mNewSession;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_root);

        mEdSession = (EditText) findViewById(R.id.edSession);
    }

    public void mOnClick(View v) {
        if(v.getId()==R.id.btnShare) {
            mStartNewShare();
        }
    }

    private void mStartNewShare() {
        mNewSession = mEdSession.getText().toString();

        if (Integer.parseInt(mNewSession) > 99) {
            Toast.makeText(getApplicationContext(), "Please input a value less than 100.", Toast.LENGTH_SHORT).show();
            return;
        }

        if (Integer.parseInt(mNewSession) < 0) {
            Toast.makeText(getApplicationContext(), "Please input a value greater than 0.", Toast.LENGTH_SHORT).show();
            return;
        }

        Intent intent = new Intent(getApplicationContext(), MainActivity.class);
        intent.putExtra("session", mNewSession);
        startActivity(intent);
    }

}
