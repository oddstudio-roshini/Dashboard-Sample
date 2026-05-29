package com.medicare.patient.utils

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore by preferencesDataStore(name = "medicare_prefs")

class PrefsManager(private val context: Context) {

    companion object {
        private val KEY_TOKEN       = stringPreferencesKey("token")
        private val KEY_PATIENT_ID  = longPreferencesKey("patient_id")
        private val KEY_PATIENT_NAME = stringPreferencesKey("patient_name")
    }

    val token: Flow<String?> = context.dataStore.data.map { it[KEY_TOKEN] }
    val patientId: Flow<Long?> = context.dataStore.data.map { it[KEY_PATIENT_ID] }
    val patientName: Flow<String?> = context.dataStore.data.map { it[KEY_PATIENT_NAME] }

    suspend fun saveSession(token: String, patientId: Long, patientName: String) {
        context.dataStore.edit { prefs ->
            prefs[KEY_TOKEN]        = token
            prefs[KEY_PATIENT_ID]   = patientId
            prefs[KEY_PATIENT_NAME] = patientName
        }
    }

    suspend fun clearSession() {
        context.dataStore.edit { it.clear() }
    }
}
