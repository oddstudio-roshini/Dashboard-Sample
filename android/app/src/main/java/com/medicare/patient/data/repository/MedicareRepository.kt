package com.medicare.patient.data.repository

import com.medicare.patient.data.api.ApiClient
import com.medicare.patient.data.local.AppDatabase
import com.medicare.patient.data.local.ExerciseEntity
import com.medicare.patient.data.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class MedicareRepository(private val db: AppDatabase) {

    private val api = ApiClient.apiService

    // ── Auth ──────────────────────────────────────────────────────────────────

    suspend fun login(patientId: Long, password: String): Result<LoginResponse> = runCatching {
        val response = api.login(LoginRequest(patientId, password))
        if (response.isSuccessful) {
            response.body() ?: error("Empty response from server")
        } else {
            error(when (response.code()) {
                401  -> "Incorrect Patient ID or password"
                404  -> "Patient not found"
                else -> "Login failed (${response.code()})"
            })
        }
    }

    // ── Exercises ─────────────────────────────────────────────────────────────

    suspend fun getExercises(patientId: Long): Result<List<ExerciseItem>> = runCatching {
        val response = api.getExercises(patientId)
        if (response.isSuccessful) {
            response.body() ?: emptyList()
        } else {
            error("Failed to fetch exercises (${response.code()})")
        }
    }

    // ── Download (offline) ────────────────────────────────────────────────────

    suspend fun downloadExercise(exerciseId: Long): Result<ExerciseEntity> = runCatching {
        val response = api.downloadExercise(exerciseId)
        if (response.isSuccessful) {
            val dto = response.body() ?: error("Empty download response")
            val entity = ExerciseEntity(
                exerciseId   = dto.exerciseId,
                name         = dto.name,
                bodyPart     = dto.bodyPart,
                description  = dto.description,
                duration     = dto.duration,
                level        = dto.level,
                sets         = dto.sets,
                reps         = dto.reps,
                frequency    = dto.frequency,
                developer    = dto.developer,
                instructions = dto.instructions,
                poseType     = dto.poseType,
                arJsonUrl    = dto.arJsonUrl
            )
            db.exerciseDao().insert(entity)
            entity
        } else {
            error("Download failed (${response.code()})")
        }
    }

    suspend fun isDownloaded(exerciseId: Long): Boolean =
        db.exerciseDao().isDownloaded(exerciseId)

    fun getAllDownloaded() = db.exerciseDao().getAllDownloaded()

    /** Fetches the AR JSON string from a Hostinger URL. */
    suspend fun fetchArJson(url: String): Result<String> = runCatching {
        withContext(Dispatchers.IO) {
            java.net.URL(url).readText()
        }
    }

    /** Removes locally downloaded exercises that no longer exist on the server. */
    suspend fun removeDeletedExercises(serverIds: List<Long>) {
        // Get all locally downloaded IDs
        val localIds = db.exerciseDao().getAllDownloadedIds()
        // Delete any that are no longer on the server
        localIds.filterNot { it in serverIds }.forEach { id ->
            db.exerciseDao().delete(id)
        }
    }
}
