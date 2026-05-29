package com.medicare.patient.data.model

import com.google.gson.annotations.SerializedName

// ── Network request/response models ───────────────────────────────────────────

data class LoginRequest(
    val patientId: Long,
    val password: String
)

data class LoginResponse(
    val patientId: Long,
    val patientName: String,
    val token: String,
    val status: String?,
    val injury: String?
)

data class ExerciseItem(
    val id: Long,
    val name: String,
    val bodyPart: String,
    val description: String,
    val duration: String?,
    val level: String,           // Beginner | Intermediate | Advanced
    val difficulty: String,      // EASY | MEDIUM | HARD
    val sets: Int?,
    val reps: Int?,
    val frequency: String?,
    val developer: String,
    val developerDate: String,
    val price: Int,
    val videoUrl: String?,
    val downloadUrl: String,
    val updatedAt: String?,         // ISO datetime of last admin edit, null if never edited
    val poseType: String?,          // e.g. "SHOULDER_FLEXION" — used by MediaPipe pose tracking
    val arJsonUrl: String? = null   // AR config JSON hosted on Hostinger, null if not yet uploaded
)

data class ExerciseDownload(
    val exerciseId: Long,
    val name: String,
    val bodyPart: String,
    val description: String,
    val duration: String?,
    val level: String,
    val sets: Int?,
    val reps: Int?,
    val frequency: String?,
    val developer: String,
    val instructions: String,
    val poseType: String?,          // "SHOULDER_FLEXION" — used for MediaPipe offline too
    val arJsonUrl: String? = null   // AR config JSON URL, stored for offline AR use
)

// ── UI state wrappers ──────────────────────────────────────────────────────────

sealed class UiState<out T> {
    object Idle : UiState<Nothing>()
    object Loading : UiState<Nothing>()
    data class Success<T>(val data: T) : UiState<T>()
    data class Error(val message: String) : UiState<Nothing>()
}
