package com.medicare.patient.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

/**
 * Room entity — stores downloaded exercises for offline access.
 */
@Entity(tableName = "downloaded_exercises")
data class ExerciseEntity(
    @PrimaryKey val exerciseId: Long,
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
    val poseType: String?,
    val arJsonUrl: String? = null,
    val downloadedAt: Long = System.currentTimeMillis()
)
