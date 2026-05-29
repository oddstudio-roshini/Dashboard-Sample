package com.medicare.patient

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.medicare.patient.data.local.AppDatabase
import com.medicare.patient.ui.navigation.AppNavigation
import com.medicare.patient.ui.theme.MedicareTheme
import com.medicare.patient.utils.PrefsManager

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        val prefs = PrefsManager(this)
        val db    = AppDatabase.getInstance(this)

        setContent {
            MedicareTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    AppNavigation(prefs = prefs, db = db)
                }
            }
        }
    }
}
